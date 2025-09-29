import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowsDownUp, 
  ArrowSquareOut, 
  MagnifyingGlass, 
  Lock, 
  Globe,
  Database,
  Archive
} from "@phosphor-icons/react";
import { RepositoryWithStorage } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/github";

interface RepositoryTableProps {
  repositories: RepositoryWithStorage[];
  onRepositorySelect: (repo: RepositoryWithStorage) => void;
  isLoading: boolean;
}

type SortField = 'name' | 'updated_at' | 'storage' | 'artifacts';
type SortOrder = 'asc' | 'desc';

export function RepositoryTable({ repositories, onRepositorySelect, isLoading }: RepositoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('storage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRepositories = [...filteredRepositories].sort((a, b) => {
    let valueA: any, valueB: any;

    switch (sortField) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'updated_at':
        valueA = new Date(a.updated_at);
        valueB = new Date(b.updated_at);
        break;
      case 'storage':
        valueA = a.actions_storage?.total_paid_storage_for_repository_gb || 0;
        valueB = b.actions_storage?.total_paid_storage_for_repository_gb || 0;
        break;
      case 'artifacts':
        valueA = a.artifacts?.filter(artifact => !artifact.expired).length || 0;
        valueB = b.artifacts?.filter(artifact => !artifact.expired).length || 0;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Repositories
        </CardTitle>
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Repository
                  <ArrowsDownUp className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('storage')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Storage Used
                  <ArrowsDownUp className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('artifacts')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Artifacts
                  <ArrowsDownUp className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('updated_at')}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Last Updated
                  <ArrowsDownUp className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRepositories.map((repo) => (
              <TableRow key={repo.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{repo.name}</span>
                        {repo.private ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{repo.full_name}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {repo.storage_loading ? (
                    <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  ) : repo.storage_error ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : repo.actions_storage ? (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {repo.actions_storage.total_paid_storage_for_repository_gb.toFixed(2)} GB
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(repo.actions_storage.total_paid_storage_for_repository)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No data</span>
                  )}
                </TableCell>
                <TableCell>
                  {repo.artifacts ? (
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Archive className="h-3 w-3" />
                        {repo.artifacts.filter(artifact => !artifact.expired).length}
                      </Badge>
                      {repo.artifacts.some(artifact => artifact.expired) && (
                        <Badge variant="outline" className="text-xs">
                          {repo.artifacts.filter(artifact => artifact.expired).length} expired
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(repo.updated_at)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRepositorySelect(repo)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(repo.html_url, '_blank')}
                    >
                      <ArrowSquareOut className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sortedRepositories.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}