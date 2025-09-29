import { Repository, ActionsStorage, Artifact, RepositoryWithStorage } from './types';

export class GitHubAPI {
  private octokit: any;

  constructor() {
    // Use the spark runtime's user context for authentication
    this.initializeOctokit();
  }

  private async initializeOctokit() {
    // For now, we'll create a mock implementation since we need GitHub token
    // In a real implementation, this would use proper authentication with spark.user()
  }

  async getRepositories(): Promise<Repository[]> {
    try {
      // Mock data for demonstration - in production this would use real GitHub API
      const mockRepos: Repository[] = [
        {
          id: 1,
          name: "my-awesome-project",
          full_name: "user/my-awesome-project",
          owner: {
            login: "user",
            avatar_url: "https://github.com/github.png"
          },
          html_url: "https://github.com/user/my-awesome-project",
          updated_at: "2024-01-15T10:30:00Z",
          size: 2048,
          private: false
        },
        {
          id: 2,
          name: "data-pipeline",
          full_name: "user/data-pipeline",
          owner: {
            login: "user",
            avatar_url: "https://github.com/github.png"
          },
          html_url: "https://github.com/user/data-pipeline",
          updated_at: "2024-01-10T14:20:00Z",
          size: 5120,
          private: true
        },
        {
          id: 3,
          name: "web-app",
          full_name: "user/web-app",
          owner: {
            login: "user",
            avatar_url: "https://github.com/github.png"
          },
          html_url: "https://github.com/user/web-app",
          updated_at: "2024-01-20T09:15:00Z",
          size: 1024,
          private: false
        }
      ];

      return mockRepos;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw new Error('Failed to fetch repositories');
    }
  }

  async getActionsStorage(owner: string, repo: string): Promise<ActionsStorage> {
    try {
      // Mock storage data - in production this would call GitHub API
      const mockStorage: ActionsStorage = {
        total_paid_storage_for_repository: Math.floor(Math.random() * 10000000000), // Random bytes
        total_paid_storage_for_repository_gb: Math.floor(Math.random() * 10) + 0.1
      };

      return mockStorage;
    } catch (error) {
      console.error(`Error fetching storage for ${owner}/${repo}:`, error);
      throw new Error('Failed to fetch storage data');
    }
  }

  async getArtifacts(owner: string, repo: string): Promise<Artifact[]> {
    try {
      // Mock artifacts data
      const mockArtifacts: Artifact[] = [
        {
          id: 1,
          name: "build-artifacts",
          size_in_bytes: 1024 * 1024 * 50, // 50MB
          url: "https://api.github.com/repos/user/repo/actions/artifacts/1",
          archive_download_url: "https://github.com/user/repo/suites/123/artifacts/1",
          expired: false,
          created_at: "2024-01-15T10:30:00Z",
          expires_at: "2024-04-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z",
          workflow_run: {
            id: 123,
            name: "CI/CD Pipeline",
            head_branch: "main"
          }
        },
        {
          id: 2,
          name: "test-results",
          size_in_bytes: 1024 * 1024 * 10, // 10MB
          url: "https://api.github.com/repos/user/repo/actions/artifacts/2",
          archive_download_url: "https://github.com/user/repo/suites/124/artifacts/2",
          expired: false,
          created_at: "2024-01-14T08:20:00Z",
          expires_at: "2024-04-14T08:20:00Z",
          updated_at: "2024-01-14T08:20:00Z",
          workflow_run: {
            id: 124,
            name: "Test Suite",
            head_branch: "develop"
          }
        }
      ];

      return mockArtifacts;
    } catch (error) {
      console.error(`Error fetching artifacts for ${owner}/${repo}:`, error);
      throw new Error('Failed to fetch artifacts');
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