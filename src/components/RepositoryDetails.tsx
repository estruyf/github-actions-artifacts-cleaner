import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Archive, 
  Clock, 
  ArrowSquareOut, 
  Download,
  CalendarBlank,
  ArrowLeft,
  Trash,
  TrashSimple 
} from "@phosphor-icons/react";
import { RepositoryWithStorage } from "@/lib/types";
import { formatBytes, formatDate, getDaysAgo, GitHubAPI } from "@/lib/github";

interface RepositoryDetailsProps {
  repository: RepositoryWithStorage;
  api: GitHubAPI;
  onBack: () => void;
  onRepositoryUpdate?: (updatedRepo: RepositoryWithStorage) => void;
}

export function RepositoryDetails({ repository, api, onBack, onRepositoryUpdate }: RepositoryDetailsProps) {
  const [currentRepository, setCurrentRepository] = useState(repository);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalArtifactSize = currentRepository.artifacts?.reduce((sum, artifact) => sum + artifact.size_in_bytes, 0) || 0;
  const expiredArtifacts = currentRepository.artifacts?.filter(artifact => artifact.expired).length || 0;

  const refreshArtifacts = async () => {
    try {
      const [storage, artifacts] = await Promise.all([
        api.getActionsStorage(currentRepository.owner.login, currentRepository.name),
        api.getArtifacts(currentRepository.owner.login, currentRepository.name)
      ]);
      
      const updatedRepo = { 
        ...currentRepository, 
        actions_storage: storage, 
        artifacts 
      };
      
      setCurrentRepository(updatedRepo);
      onRepositoryUpdate?.(updatedRepo);
    } catch (error) {
      console.error('Error refreshing artifacts:', error);
      if (error instanceof Error && error.message.includes('token')) {
        toast.error('Authentication failed. Please check your GitHub token.');
      } else {
        toast.error('Failed to refresh artifact data');
      }
    }
  };

  const handleDeleteArtifact = async (artifactId: number) => {
    setIsDeleting(true);
    try {
      await api.deleteArtifact(currentRepository.owner.login, currentRepository.name, artifactId);
      toast.success('Artifact deleted successfully');
      
      // Update local state by removing the deleted artifact
      const updatedRepo = {
        ...currentRepository,
        artifacts: currentRepository.artifacts?.filter(artifact => artifact.id !== artifactId) || []
      };
      
      setCurrentRepository(updatedRepo);
      onRepositoryUpdate?.(updatedRepo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete artifact';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setArtifactToDelete(null);
    }
  };

  const handleDeleteAllArtifacts = async () => {
    setIsDeleting(true);
    try {
      const result = await api.deleteAllArtifacts(currentRepository.owner.login, currentRepository.name);
      
      let message = `Successfully deleted ${result.deleted} artifacts`;
      if (result.skipped > 0) {
        message += `, ${result.skipped} expired artifacts skipped`;
      }
      if (result.failed > 0) {
        message += `, ${result.failed} failed`;
        toast.warning(message);
      } else {
        toast.success(message);
      }
      
      // Update local state by keeping only expired artifacts (since we can't delete them)
      const updatedRepo = {
        ...currentRepository,
        artifacts: currentRepository.artifacts?.filter(artifact => artifact.expired) || []
      };
      
      setCurrentRepository(updatedRepo);
      onRepositoryUpdate?.(updatedRepo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete artifacts';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteAllDialogOpen(false);
    }
  };

  const openDeleteDialog = (artifactId: number) => {
    setArtifactToDelete(artifactId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Archive className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">{currentRepository.name}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Repository Summary */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {currentRepository.actions_storage?.total_paid_storage_for_repository_gb.toFixed(2) || '0'} GB
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatBytes(currentRepository.actions_storage?.total_paid_storage_for_repository || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Artifacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{currentRepository.artifacts?.length || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  artifacts stored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expired Artifacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{expiredArtifacts}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  need cleanup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{getDaysAgo(currentRepository.updated_at)}</div>
                <p className="text-sm text-muted-foreground mt-1">days ago</p>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Alert */}
          <Alert>
            <AlertDescription>
              <strong>Permissions Required:</strong> To delete artifacts, your GitHub token must have the <code>actions:write</code> scope. 
              If you get "401 Unauthorized" errors when deleting, please{' '}
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo,actions:read,actions:write&description=GitHub%20Actions%20Storage%20Dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                create a new token
              </a>{' '}
              with the required scopes.
            </AlertDescription>
          </Alert>

          {/* Artifacts Table */}
          {currentRepository.artifacts && currentRepository.artifacts.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Archive className="h-6 w-6" />
                    Artifacts ({currentRepository.artifacts.length})
                  </CardTitle>
                  {currentRepository.artifacts.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteAllDialogOpen(true)}
                      disabled={isDeleting}
                    >
                      <TrashSimple className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[100px]">Size</TableHead>
                        <TableHead className="w-[180px]">Workflow</TableHead>
                        <TableHead className="w-[140px]">Created</TableHead>
                        <TableHead className="w-[140px]">Expires</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRepository.artifacts.map((artifact) => (
                        <TableRow key={artifact.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{artifact.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ID: {artifact.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {formatBytes(artifact.size_in_bytes)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {artifact.workflow_run ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm">{artifact.workflow_run.name}</span>
                                <Badge variant="outline" className="w-fit text-xs">
                                  {artifact.workflow_run.head_branch}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarBlank className="h-3 w-3" />
                              {formatDate(artifact.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {formatDate(artifact.expires_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={artifact.expired ? "destructive" : "secondary"}>
                              {artifact.expired ? "Expired" : "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(artifact.archive_download_url, '_blank')}
                                disabled={artifact.expired}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeleteDialog(artifact.id)}
                                disabled={isDeleting}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Artifacts Found</h3>
                <p className="text-muted-foreground">
                  This repository doesn't have any GitHub Actions artifacts.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(`${currentRepository.html_url}/actions`, '_blank')}
                  className="justify-start h-12"
                >
                  <ArrowSquareOut className="h-4 w-4 mr-3" />
                  View Actions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`${currentRepository.html_url}/settings/actions`, '_blank')}
                  className="justify-start h-12"
                >
                  <ArrowSquareOut className="h-4 w-4 mr-3" />
                  Actions Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(currentRepository.html_url, '_blank')}
                  className="justify-start h-12"
                >
                  <ArrowSquareOut className="h-4 w-4 mr-3" />
                  View Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Single Artifact Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this artifact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => artifactToDelete && handleDeleteArtifact(artifactToDelete)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Artifacts Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Artifacts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {currentRepository.artifacts?.length || 0} artifacts for this repository? 
              This action cannot be undone and will free up approximately {formatBytes(totalArtifactSize)} of storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllArtifacts}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}