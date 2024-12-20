import { fetchProjects } from "./request";
import { getProjects, getRequestProjectsTimestamp, setProjects, setRequestProjectsTimestamp } from "./storage";
import { Project } from "./types";
import { environment } from "@raycast/api";


// 计算时间戳
async function calculateTimestampDays(): Promise<number> {
  // 1. 获取当前时间戳
  const now = Date.now();
  // 2. 获取上次请求项目的时间戳
  const lastRequestTime = await getRequestProjectsTimestamp();

  // 3. 如果上次请求项目的时间戳为空，则设置为当前时间戳
  if (!lastRequestTime) {
    (now);
  }

  // 4. 获取两次时间戳的差值的天数
  const diff = (now - (lastRequestTime ?? now)) / 1000 / 60 / 60 / 24;
  return diff;
}

const CACHE_DAYS = 30;

// 获取项目缓存
export async function getProjectsCache(gitlabApi: string, gitlabToken: string): Promise<Project[]> {
  const days = await calculateTimestampDays();

  let projects = await getProjects();
  if (environment.isDevelopment) {
  }

  if (days > CACHE_DAYS || !projects.length) {
    projects = await fetchProjects(gitlabApi, gitlabToken);
    environment.isDevelopment && console.log('重新请求项目数据----------', projects.length);
    setProjects(projects);
    setRequestProjectsTimestamp(Date.now());
  }
  return projects;
}