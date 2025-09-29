export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  updated_at: string;
  size: number;
  private: boolean;
}

export interface ActionsStorage {
  total_paid_storage_for_repository: number;
  total_paid_storage_for_repository_gb: number;
}

export interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  url: string;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  expires_at: string;
  updated_at: string;
  workflow_run?: {
    id: number;
    name: string;
    head_branch: string;
  };
}

export interface RepositoryWithStorage extends Repository {
  actions_storage?: ActionsStorage;
  artifacts?: Artifact[];
  storage_loading?: boolean;
  storage_error?: string;
}

export interface StorageStats {
  total_storage_gb: number;
  total_repositories: number;
  repositories_with_storage: number;
  largest_repository: {
    name: string;
    storage_gb: number;
  };
  total_artifacts: number;
  oldest_artifact_days: number;
}

export interface Enterprise {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  html_url: string;
}

export interface UserEnterprises {
  enterprises: Enterprise[];
}