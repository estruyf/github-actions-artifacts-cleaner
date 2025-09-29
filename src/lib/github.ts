import { Repository, ActionsStorage, Artifact, RepositoryWithStorage } from './types';

export class GitHubAPI {
  private token: string | null = null;

  constructor(token?: string) {
    if (token && token.trim()) {
      this.token = token.trim();
    }
  }

  setToken(token: string) {
    if (token && token.trim()) {
      this.token = token.trim();
    }
  }

  hasValidToken(): boolean {
    return !!(this.token && this.token.trim() && this.token !== 'null' && this.token !== 'undefined');
  }

  private async makeRequest(url: string): Promise<any> {
    if (!this.hasValidToken()) {
      throw new Error('GitHub token not set or invalid');
    }

    const response = await fetch(`https://api.github.com${url}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRepositories(): Promise<Repository[]> {
    try {
      const repos = await this.makeRequest('/user/repos?sort=updated&per_page=100');
      
      return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url
        },
        html_url: repo.html_url,
        updated_at: repo.updated_at,
        size: repo.size,
        private: repo.private
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  async getActionsStorage(owner: string, repo: string): Promise<ActionsStorage> {
    try {
      // GitHub doesn't have a direct API for Actions storage, so we'll estimate based on artifacts
      const artifacts = await this.getArtifacts(owner, repo);
      const totalBytes = artifacts.reduce((sum, artifact) => sum + artifact.size_in_bytes, 0);
      
      return {
        total_paid_storage_for_repository: totalBytes,
        total_paid_storage_for_repository_gb: totalBytes / (1024 * 1024 * 1024)
      };
    } catch (error) {
      console.error(`Error fetching storage for ${owner}/${repo}:`, error);
      throw new Error('Failed to fetch storage data');
    }
  }

  async getArtifacts(owner: string, repo: string): Promise<Artifact[]> {
    try {
      const response = await this.makeRequest(`/repos/${owner}/${repo}/actions/artifacts?per_page=100`);
      
      return response.artifacts.map((artifact: any) => ({
        id: artifact.id,
        name: artifact.name,
        size_in_bytes: artifact.size_in_bytes,
        url: artifact.url,
        archive_download_url: artifact.archive_download_url,
        expired: artifact.expired,
        created_at: artifact.created_at,
        expires_at: artifact.expires_at,
        updated_at: artifact.updated_at,
        workflow_run: {
          id: artifact.workflow_run?.id || 0,
          name: artifact.workflow_run?.name || 'Unknown',
          head_branch: artifact.workflow_run?.head_branch || 'unknown'
        }
      }));
    } catch (error) {
      console.error(`Error fetching artifacts for ${owner}/${repo}:`, error);
      // Return empty array instead of throwing for individual repo failures
      return [];
    }
  }

  async deleteArtifact(owner: string, repo: string, artifactId: number): Promise<void> {
    if (!this.hasValidToken()) {
      throw new Error('GitHub token not set or invalid');
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/artifacts/${artifactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Permission denied: Your GitHub token needs "actions:write" scope to delete artifacts. Please create a new token with the required permissions.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden: You may not have write access to this repository or the artifact may be protected.');
        } else if (response.status === 404) {
          throw new Error('Artifact not found: It may have already been deleted or expired.');
        }
        throw new Error(`Failed to delete artifact: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting artifact ${artifactId}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete artifact');
    }
  }

  async deleteAllArtifacts(owner: string, repo: string): Promise<{ deleted: number; failed: number }> {
    try {
      const artifacts = await this.getArtifacts(owner, repo);
      let deleted = 0;
      let failed = 0;

      // Delete artifacts in parallel but with some rate limiting
      const deletePromises = artifacts.map(async (artifact) => {
        try {
          await this.deleteArtifact(owner, repo, artifact.id);
          deleted++;
        } catch (error) {
          console.error(`Failed to delete artifact ${artifact.id}:`, error);
          failed++;
        }
      });

      await Promise.all(deletePromises);
      
      return { deleted, failed };
    } catch (error) {
      console.error(`Error deleting all artifacts for ${owner}/${repo}:`, error);
      throw new Error('Failed to delete artifacts');
    }
  }
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getDaysAgo = (date: string): number => {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now.getTime() - past.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};