import { LocalStorage } from "@raycast/api";
import { Project, ProjectAccess } from "./types";

const FAVORITES_KEY = "gitlab-favorites";
const RECENT_KEY = "gitlab-recent";
const MAX_RECENT_ITEMS = 20;
const REQUEST_PROJECTS_TIME_KEY = "gitlab-request-projects-time";
const PROJECTS_KEY = "gitlab-projects";

export async function getFavorites(): Promise<number[]> {
  const favorites = await LocalStorage.getItem<string>(FAVORITES_KEY);
  return favorites ? JSON.parse(favorites) : [];
}

export async function toggleFavorite(projectId: number): Promise<boolean> {
  const favorites = await getFavorites();
  const newFavorites = favorites.includes(projectId)
    ? favorites.filter(id => id !== projectId)
    : [...favorites, projectId];
  
  await LocalStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  return newFavorites.includes(projectId);
}

export async function getRecentAccess(): Promise<ProjectAccess[]> {
  const recent = await LocalStorage.getItem<string>(RECENT_KEY);
  return recent ? JSON.parse(recent) : [];
}

export async function addRecentAccess(projectId: number, pageType: string): Promise<void> {
  const recent = await getRecentAccess();
  const newAccess: ProjectAccess = {
    projectId,
    pageType,
    timestamp: Date.now(),
  };
  
  const filtered = recent.filter(item => item.projectId !== projectId || item.pageType !== pageType);
  const newRecent = [newAccess, ...filtered].slice(0, MAX_RECENT_ITEMS);
  
  await LocalStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
}

// 获取上次请求项目的时间
export function getRequestProjectsTimestamp(): Promise<number | undefined> {
  return LocalStorage.getItem(REQUEST_PROJECTS_TIME_KEY)
}

// 设置上次请求项目的时间
export function setRequestProjectsTimestamp(time: number): void {
  LocalStorage.setItem(REQUEST_PROJECTS_TIME_KEY, time.toString());
}


export function clearRequestProjectsTimestamp(): void {
  LocalStorage.removeItem(REQUEST_PROJECTS_TIME_KEY);
}


export function setProjects(projects: Project[]): void {
  LocalStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function getProjects(): Promise<Project[]> {
  const projects = await LocalStorage.getItem(PROJECTS_KEY);
  if (!projects) {
    return [];
  }
  return JSON.parse(projects as string) as Project[];
}