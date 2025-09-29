import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StorageOverview } from "@/components/StorageOverview";
import { RepositoryTable } from "@/components/RepositoryTable";
import { RepositoryDetails } from "@/components/RepositoryDetails";
import { AuthSetup } from "@/components/AuthSetup";
import { EnterpriseRequest } from "@/components/EnterpriseRequest";
import { AutoCleanup } from "@/components/AutoCleanup";
import { Database, ArrowClockwise, SignOut } from "@phosphor-icons/react";
import { GitHubAPI } from "@/lib/github";
import { RepositoryWithStorage, StorageStats } from "@/lib/types";
import { useKV } from '@github/spark/hooks';

function App() {
  const [repositories, setRepositories] = useState<RepositoryWithStorage[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<RepositoryWithStorage | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'repository'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [api, setApi] = useState<GitHubAPI | null>(null);
  const [savedToken] = useKV("github-pat", "");
  const [currentEnterpriseSlug, setCurrentEnterpriseSlug] = useState<string | null>(null);

  const calculateStats = (repos: RepositoryWithStorage[]): StorageStats => {
    // Calculate storage only from non-expired artifacts since expired artifacts don't contribute to storage
    const reposWithStorage = repos.filter(repo => {
      if (!repo.artifacts) return false;
      const nonExpiredArtifacts = repo.artifacts.filter(artifact => !artifact.expired);
      return nonExpiredArtifacts.length > 0 && nonExpiredArtifacts.reduce((sum, artifact) => sum + artifact.size_in_bytes, 0) > 0;
    });
    
    const totalStorage = repos.reduce((sum, repo) => {
      if (!repo.artifacts) return sum;
      const nonExpiredStorage = repo.artifacts
        .filter(artifact => !artifact.expired)
        .reduce((artifactSum, artifact) => artifactSum + artifact.size_in_bytes, 0);
      return sum + (nonExpiredStorage / (1024 * 1024 * 1024)); // Convert to GB
    }, 0);
    
    // Count only non-expired artifacts for display purposes (expired artifacts don't contribute to storage)
    const totalArtifacts = repos.reduce((sum, repo) => {
      if (!repo.artifacts) return sum;
      return sum + repo.artifacts.filter(artifact => !artifact.expired).length;
    }, 0);
    
    const largestRepo = repos.reduce((largest, repo) => {
      if (!repo.artifacts) return largest;
      const nonExpiredStorage = repo.artifacts
        .filter(artifact => !artifact.expired)
        .reduce((artifactSum, artifact) => artifactSum + artifact.size_in_bytes, 0) / (1024 * 1024 * 1024); // Convert to GB
      return nonExpiredStorage > largest.storage_gb ? { name: repo.name, storage_gb: nonExpiredStorage } : largest;
    }, { name: 'None', storage_gb: 0 });

    return {
      total_storage_gb: totalStorage,
      total_repositories: repos.length,
      repositories_with_storage: reposWithStorage.length,
      largest_repository: largestRepo,
      total_artifacts: totalArtifacts,
      oldest_artifact_days: 0
    };
  };

  const loadRepositories = async (enterpriseSlug?: string) => {
    if (!api) return;
    
    setIsLoading(true);
    try {
      const repos = enterpriseSlug 
        ? await api.getEnterpriseRepositories(enterpriseSlug)
        : await api.getRepositories();
      
      const reposWithStorage = repos.map(repo => ({ ...repo }));
      
      setRepositories(reposWithStorage);
      setCurrentEnterpriseSlug(enterpriseSlug || null);
      
      // Load storage data for each repository
      for (const repo of reposWithStorage) {
        try {
          const [storage, artifacts] = await Promise.all([
            api.getActionsStorage(repo.owner.login, repo.name),
            api.getArtifacts(repo.owner.login, repo.name)
          ]);
          
          setRepositories((current) => current.map(r => 
            r.id === repo.id 
              ? { ...r, actions_storage: storage, artifacts }
              : r
          ));
        } catch (error) {
          console.error(`Error loading data for ${repo.name}:`, error);
          setRepositories((current) => current.map(r => 
            r.id === repo.id 
              ? { ...r, storage_error: 'Failed to load' }
              : r
          ));
        }
      }
      
      setLastUpdated(new Date().toISOString());
      const repoType = enterpriseSlug ? "enterprise" : "personal";
      toast.success(`${repoType} repository data refreshed successfully`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('token')) {
        toast.error("Authentication failed. Please check your GitHub token.");
        handleSignOut();
      } else {
        toast.error("Failed to load repositories");
        console.error("Error loading repositories:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSet = (token: string) => {
    if (token && token.trim()) {
      const newApi = new GitHubAPI(token.trim());
      setApi(newApi);
    }
  };

  const handleSignOut = () => {
    setApi(null);
    setRepositories([]);
    setSelectedRepository(null);
    setLastUpdated(null);
    setCurrentEnterpriseSlug(null);
  };

  const handleEnterpriseRequest = async (enterpriseSlug: string) => {
    await loadRepositories(enterpriseSlug);
  };

  const handleBackToPersonalRepos = () => {
    loadRepositories(); // Load without enterprise slug
  };

  const handleRefresh = () => {
    loadRepositories(currentEnterpriseSlug || undefined);
  };

  const handleRepositoryUpdate = (updatedRepo: RepositoryWithStorage) => {
    setRepositories(current => 
      current.map(repo => 
        repo.id === updatedRepo.id ? updatedRepo : repo
      )
    );
  };

  const handleRepositorySelect = (repo: RepositoryWithStorage) => {
    setSelectedRepository(repo);
    setCurrentView('repository');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedRepository(null);
  };

  const stats = calculateStats(repositories);

  // Check if we have a saved token on mount
  useEffect(() => {
    if (savedToken && savedToken.trim() && !api) {
      const newApi = new GitHubAPI(savedToken.trim());
      setApi(newApi);
    }
  }, [savedToken, api]);

  useEffect(() => {
    if (api && repositories.length === 0) {
      loadRepositories();
    }
  }, [api]);

  // Show auth setup if no API is configured
  if (!api) {
    return <AuthSetup onTokenSet={handleTokenSet} />;
  }

  // Show repository details page
  if (currentView === 'repository' && selectedRepository) {
    return (
      <RepositoryDetails 
        repository={selectedRepository} 
        api={api}
        onBack={handleBackToDashboard}
        onRepositoryUpdate={handleRepositoryUpdate}
      />
    );
  }

  // Show main dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                GitHub Actions Storage
                {currentEnterpriseSlug && (
                  <span className="text-xl font-normal text-muted-foreground ml-2">
                    - {currentEnterpriseSlug}
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {currentEnterpriseSlug 
                  ? `Monitor storage usage across ${currentEnterpriseSlug} enterprise repositories`
                  : "Monitor storage usage and manage artifacts across your repositories"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
            {currentEnterpriseSlug && (
              <Button variant="outline" onClick={handleBackToPersonalRepos}>
                Back to Personal Repos
              </Button>
            )}
            <Button onClick={handleRefresh} disabled={isLoading}>
              <ArrowClockwise className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <SignOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Storage Overview */}
        <StorageOverview stats={stats} isLoading={isLoading} />

        {/* Enterprise Request - Only show for personal repos */}
        {!currentEnterpriseSlug && (
          <EnterpriseRequest 
            api={api} 
            onEnterpriseRequest={handleEnterpriseRequest}
          />
        )}

        {/* Auto-Cleanup Configuration */}
        <AutoCleanup 
          api={api}
          repositories={repositories}
          onCleanupComplete={handleRefresh}
        />

        {/* Repository Table */}
        <RepositoryTable
          repositories={repositories}
          onRepositorySelect={handleRepositorySelect}
          isLoading={isLoading}
        />
      </div>
      <Toaster />
    </div>
  );
}

export default App;