import { Project } from "./types";
import fetch from "node-fetch";


async function fetchProjects(gitlabUrl: string, gitlabToken: string): Promise<Project[]> {
  const response = await fetch(`${gitlabUrl}/api/v4/projects?membership=true&per_page=100`, {
    headers: {
      "PRIVATE-TOKEN": gitlabToken
    }
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  
  return response.json() as Promise<Project[]>;
}


export { fetchProjects };