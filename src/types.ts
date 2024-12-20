export interface Project {
  id: number;
  path_with_namespace: string;
  name: string;
  web_url: string;
}

export interface ProjectAccess {
  projectId: number;
  timestamp: number;
  pageType: string;
}

export interface Preferences {
  gitlabToken: string;
  gitlabUrl: string;
}