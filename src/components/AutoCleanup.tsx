import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Broom, 
  CaretDown, 
  CaretUp, 
  Play, 
  Eye, 
  Clock, 
  Archive,
  Warning,
  CheckCircle,
  XCircle
} from "@phosphor-icons/react";
import { GitHubAPI, formatBytes } from "@/lib/github";
import { RepositoryWithStorage, AutoCleanupConfig, CleanupResult } from "@/lib/types";
import { useKV } from '@github/spark/hooks';

interface AutoCleanupProps {
  api: GitHubAPI;
  repositories: RepositoryWithStorage[];
  onCleanupComplete: () => void;
}

export function AutoCleanup({ api, repositories, onCleanupComplete }: AutoCleanupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<Map<string, CleanupResult> | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Store max age days setting
  const [maxAgeDays, setMaxAgeDays] = useKV<number>("cleanup-max-age-days", 30);

  const runCleanup = async (dryRun: boolean = true) => {
    if (repositories.length === 0) {
      toast.error("No repositories loaded");
      return;
    }

    setIsRunning(true);
    setShowResults(false);
    
    try {
      const config: AutoCleanupConfig = {
        enabled: true,
        maxAgeDays: maxAgeDays || 30,
        dryRun
      };
      const results = await api.bulkCleanupRepositories(repositories, config);
      
      setCleanupResults(results);
      setShowResults(true);
      
      const totalDeleted = Array.from(results.values()).reduce((sum, r) => sum + r.deletedCount, 0);
      const totalSize = Array.from(results.values()).reduce((sum, r) => sum + r.totalSizeMB, 0);
      const reposWithArtifacts = Array.from(results.values()).filter(r => r.artifacts.length > 0).length;
      
      if (dryRun) {
        toast.success(
          `Preview complete: Found ${totalDeleted} deletable artifacts (${formatBytes(totalSize * 1024 * 1024)}) across ${reposWithArtifacts} repositories (expired artifacts excluded)`
        );
      } else {
        toast.success(
          `Cleanup complete: Deleted ${totalDeleted} artifacts (${formatBytes(totalSize * 1024 * 1024)}) from ${reposWithArtifacts} repositories`
        );
        onCleanupComplete();
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
      toast.error(error instanceof Error ? error.message : "Cleanup failed");
    } finally {
      setIsRunning(false);
    }
  };

  const getCleanupSummary = () => {
    if (!cleanupResults) return null;
    
    const totalArtifacts = Array.from(cleanupResults.values()).reduce(
      (sum, result) => sum + result.artifacts.length, 0
    );
    const totalSizeMB = Array.from(cleanupResults.values()).reduce(
      (sum, result) => sum + result.totalSizeMB, 0
    );
    const reposWithCleanup = Array.from(cleanupResults.values()).filter(
      result => result.artifacts.length > 0
    ).length;
    
    return { totalArtifacts, totalSizeMB, reposWithCleanup };
  };

  const summary = getCleanupSummary();

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Broom className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Artifact Cleanup
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preview and clean up old artifacts across repositories
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <CaretUp className="h-4 w-4" />
              ) : (
                <CaretDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-age">Maximum Age (days)</Label>
                <Input
                  id="max-age"
                  type="number"
                  min="1"
                  max="365"
                  value={maxAgeDays}
                  onChange={(e) => setMaxAgeDays(parseInt(e.target.value) || 30)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Delete non-expired artifacts older than this many days (expired artifacts are automatically excluded from cleanup)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                onClick={() => runCleanup(true)}
                disabled={isRunning}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Deletable Artifacts
              </Button>
              
              <Button
                onClick={() => runCleanup(false)}
                disabled={isRunning}
                variant="default"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running..." : "Run Cleanup"}
              </Button>

              {summary && (
                <div className="text-sm text-muted-foreground ml-auto">
                  {summary.totalArtifacts} artifacts • {formatBytes(summary.totalSizeMB * 1024 * 1024)} • {summary.reposWithCleanup} repos
                </div>
              )}
            </div>

            {/* Results */}
            {showResults && cleanupResults && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Cleanup Results
                </h4>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Array.from(cleanupResults.entries()).map(([repoName, result]) => {
                    if (result.artifacts.length === 0 && result.errors.length === 0) return null;
                    
                    return (
                      <Card key={repoName} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{repoName}</span>
                            {result.deletedCount > 0 && (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {result.deletedCount} deleted
                              </Badge>
                            )}
                            {result.errors.length > 0 && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                {result.errors.length} errors
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatBytes(result.totalSizeMB * 1024 * 1024)}
                          </span>
                        </div>
                        
                        {result.artifacts.length > 0 && (
                          <div className="space-y-1">
                            {result.artifacts.slice(0, 3).map((artifact) => (
                              <div key={artifact.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{artifact.name}</span>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{artifact.ageDays}d</span>
                                  <span>{formatBytes(artifact.sizeMB * 1024 * 1024)}</span>
                                </div>
                              </div>
                            ))}
                            {result.artifacts.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                ... and {result.artifacts.length - 3} more artifacts
                              </p>
                            )}
                          </div>
                        )}
                        
                        {result.errors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {result.errors.map((error, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-destructive">
                                <Warning className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span className="text-xs">{error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}