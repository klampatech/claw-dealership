export interface Alternative {
  id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription?: string;
  githubUrl: string;
  stars?: number;
  downloads?: number;
  language: string;
  category: Category;
  security: SecurityLevel;
  deployment: Deployment[];
  hardware: Hardware[];
  useCases: UseCase[];
  features: string[];
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export type Category =
  | 'popular'
  | 'security'
  | 'lightweight'
  | 'enterprise'
  | 'hardware';

export type SecurityLevel =
  | 'sandboxed'
  | 'workspace-isolation'
  | 'minimal-permissions'
  | 'standard';

export type Deployment =
  | 'local'
  | 'cloud'
  | 'docker'
  | 'serverless'
  | 'desktop'
  | 'embedded';

export type Hardware =
  | 'x86_64'
  | 'arm64'
  | 'esp32'
  | 'raspberry-pi'
  | 'risc-v'
  | 'cloud-only';

export type UseCase =
  | 'personal'
  | 'enterprise'
  | 'development'
  | 'automation'
  | 'research';

export interface User {
  id: string;
  githubId: string;
  username: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface FilterState {
  search: string;
  category: string;
  security: string;
  deployment: string;
  hardware: string;
  useCase: string;
  language: string;
  sortBy: string;
}
