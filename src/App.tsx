import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StorageOverview } from "@/components/StorageOverview";
import { RepositoryTable } from "@/components/RepositoryTable";
import { RepositoryDetails } from "@/components/RepositoryDetails";
import { Database, ArrowClockwise } from "@phosphor-icons/react";
import { GitHubAPI } from "@/lib/github";
import { RepositoryWithStorage, StorageStats } from "@/lib/types";

const api = new GitHubAPI();

function App() {
  const [repositories, setRepositories] = useState<RepositoryWithStorage[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<RepositoryWithStorage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const calculateStats = (repos: RepositoryWithStorage[]): StorageStats => {
    const reposWithStorage = repos.filter(repo => repo.actions_storage && repo.actions_storage.total_paid_storage_for_repository_gb > 0);
    const totalStorage = reposWithStorage.reduce((sum, repo) => sum + (repo.actions_storage?.total_paid_storage_for_repository_gb || 0), 0);
    const totalArtifacts = repos.reduce((sum, repo) => sum + (repo.artifacts?.length || 0), 0);
    
    const largestRepo = reposWithStorage.reduce((largest, repo) => {
      const storage = repo.actions_storage?.total_paid_storage_for_repository_gb || 0;
      return storage > largest.storage_gb ? { name: repo.name, storage_gb: storage } : largest;
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

  const loadRepositories = async () => {
    setIsLoading(true);
    try {
      const repos = await api.getRepositories();
      const reposWithStorage = repos.map(repo => ({ ...repo }));
      
      setRepositories(reposWithStorage);
      
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
      toast.success("Repository data refreshed successfully");
    } catch (error) {
      toast.error("Failed to load repositories");
      console.error("Error loading repositories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepositorySelect = (repo: RepositoryWithStorage) => {
    setSelectedRepository(repo);
  };

  const stats = calculateStats(repositories);

  useEffect(() => {
    if (!repositories || repositories.length === 0) {
      loadRepositories();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">GitHub Actions Storage</h1>
              <p className="text-muted-foreground">
                Monitor storage usage and manage artifacts across your repositories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
            <Button onClick={loadRepositories} disabled={isLoading}>
              <ArrowClockwise className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Storage Overview */}
        <StorageOverview stats={stats} isLoading={isLoading} />

        {/* Repository Table */}
        <RepositoryTable
          repositories={repositories}
          onRepositorySelect={handleRepositorySelect}
          isLoading={isLoading}
        />

        {/* Repository Details Modal */}
        <RepositoryDetails
          repository={selectedRepository}
          isOpen={!!selectedRepository}
          onClose={() => setSelectedRepository(null)}
        />
      </div>
      <Toaster />
    </div>
  );
}

export default App;