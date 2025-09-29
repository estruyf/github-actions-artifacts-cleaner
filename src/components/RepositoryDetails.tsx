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
  CalendarBlank,
  ArrowLeft 
} from "@phosphor-icons/react";
import { RepositoryWithStorage } from "@/lib/types";
import { formatBytes, formatDate, getDaysAgo } from "@/lib/github";

interface RepositoryDetailsProps {
  repository: RepositoryWithStorage;
  onBack: () => void;
}

export function RepositoryDetails({ repository, onBack }: RepositoryDetailsProps) {
  const totalArtifactSize = repository.artifacts?.reduce((sum, artifact) => sum + artifact.size_in_bytes, 0) || 0;
  const expiredArtifacts = repository.artifacts?.filter(artifact => artifact.expired).length || 0;

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
              <h1 className="text-2xl font-bold tracking-tight">{repository.name}</h1>
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
                  {repository.actions_storage?.total_paid_storage_for_repository_gb.toFixed(2) || '0'} GB
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatBytes(repository.actions_storage?.total_paid_storage_for_repository || 0)}
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
                <div className="text-3xl font-bold text-primary">{repository.artifacts?.length || 0}</div>
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
                <div className="text-3xl font-bold text-primary">{getDaysAgo(repository.updated_at)}</div>
                <p className="text-sm text-muted-foreground mt-1">days ago</p>
              </CardContent>
            </Card>
          </div>

          {/* Artifacts Table */}
          {repository.artifacts && repository.artifacts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Archive className="h-6 w-6" />
                  Artifacts ({repository.artifacts.length})
                </CardTitle>
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
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repository.artifacts.map((artifact) => (
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(artifact.archive_download_url, '_blank')}
                              disabled={artifact.expired}
                              className="w-full"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
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
                  onClick={() => window.open(`${repository.html_url}/actions`, '_blank')}
                  className="justify-start h-12"
                >
                  <ArrowSquareOut className="h-4 w-4 mr-3" />
                  View Actions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`${repository.html_url}/settings/actions`, '_blank')}
                  className="justify-start h-12"
                >
                  <ArrowSquareOut className="h-4 w-4 mr-3" />
                  Actions Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(repository.html_url, '_blank')}
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
    </div>
  );
}