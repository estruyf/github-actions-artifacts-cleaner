import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CalendarBlank 
} from "@phosphor-icons/react";
import { RepositoryWithStorage } from "@/lib/types";
import { formatBytes, formatDate, getDaysAgo } from "@/lib/github";

interface RepositoryDetailsProps {
  repository: RepositoryWithStorage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RepositoryDetails({ repository, isOpen, onClose }: RepositoryDetailsProps) {
  if (!repository) return null;

  const totalArtifactSize = repository.artifacts?.reduce((sum, artifact) => sum + artifact.size_in_bytes, 0) || 0;
  const expiredArtifacts = repository.artifacts?.filter(artifact => artifact.expired).length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            {repository.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Repository Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {repository.actions_storage?.total_paid_storage_for_repository_gb.toFixed(2) || '0'} GB
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(repository.actions_storage?.total_paid_storage_for_repository || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Artifacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repository.artifacts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {expiredArtifacts} expired
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
                <div className="text-2xl font-bold">{getDaysAgo(repository.updated_at)}</div>
                <p className="text-xs text-muted-foreground">days ago</p>
              </CardContent>
            </Card>
          </div>

          {/* Artifacts Table */}
          {repository.artifacts && repository.artifacts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Artifacts ({repository.artifacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repository.artifacts.map((artifact) => (
                      <TableRow key={artifact.id}>
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
                            <div className="flex flex-col">
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(artifact.archive_download_url, '_blank')}
                              disabled={artifact.expired}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Artifacts Found</h3>
                <p className="text-muted-foreground">
                  This repository doesn't have any GitHub Actions artifacts.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(`${repository.html_url}/actions`, '_blank')}
                >
                  <ArrowSquareOut className="h-4 w-4 mr-2" />
                  View Actions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`${repository.html_url}/settings/actions`, '_blank')}
                >
                  <ArrowSquareOut className="h-4 w-4 mr-2" />
                  Actions Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(repository.html_url, '_blank')}
                >
                  <ArrowSquareOut className="h-4 w-4 mr-2" />
                  View Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}