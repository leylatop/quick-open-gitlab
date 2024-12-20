import { ActionPanel, Action, Icon, List, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import fetch from "node-fetch";
import { Project, ProjectAccess } from "./types";
import { getFavorites, toggleFavorite, getRecentAccess, addRecentAccess } from "./storage";

const PAGES = [
  { title: "Dashboard", suffix: "", icon: Icon.Home },
  { title: "Branches", suffix: "/-/branches", icon: Icon.List },
  { title: "Commits", suffix: "/-/commits/main", icon: Icon.Terminal },
  { title: "Pipelines", suffix: "/-/pipelines", icon: Icon.Circle },
  { title: "Merge Requests", suffix: "/-/merge_requests", icon: Icon.Document }
];

export default function Command() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentAccess, setRecentAccess] = useState<ProjectAccess[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("all"); // all, favorites, recent
  
  const { gitlabToken, gitlabUrl } = getPreferenceValues<Preferences>();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsData, favoritesData, recentData] = await Promise.all([
        fetchProjects(),
        getFavorites(),
        getRecentAccess()
      ]);
      
      setProjects(projectsData);
      setFavorites(favoritesData);
      setRecentAccess(recentData);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load data",
        message: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProjects(): Promise<Project[]> {
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

  async function handleProjectAccess(project: Project, pageType: string) {
    await addRecentAccess(project.id, pageType);
    const newRecent = await getRecentAccess();
    setRecentAccess(newRecent);
    setSelectedProject(null);
  }

  async function handleToggleFavorite(projectId: number) {
    const isFavorite = await toggleFavorite(projectId);
    setFavorites(await getFavorites());
    await showToast({
      style: Toast.Style.Success,
      title: isFavorite ? "Added to favorites" : "Removed from favorites"
    });
  }

  function getFilteredProjects(): Project[] {
    switch (selectedSection) {
      case "favorites":
        return projects.filter(p => favorites.includes(p.id));
      case "recent":
        const recentIds = new Set(recentAccess.map(r => r.projectId));
        return projects.filter(p => recentIds.has(p.id));
      default:
        return projects;
    }
  }

  // 如果已选择项目，显示页面选择列表
  if (selectedProject) {
    return (
      <List
        searchBarPlaceholder="Select Page..."
      >
        {PAGES.map((page) => (
          <List.Item
            key={page.title}
            icon={page.icon}
            title={page.title}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  url={`${selectedProject.web_url}${page.suffix}`}
                  onOpen={() => handleProjectAccess(selectedProject, page.title)}
                />
                <Action
                  title="Back to Projects"
                  icon={Icon.ArrowLeft}
                  shortcut={{ modifiers: ["cmd"], key: "[" }}
                  onAction={() => setSelectedProject(null)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List>
    );
  }

  // 显示项目列表
  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search projects..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Section"
          value={selectedSection}
          onChange={setSelectedSection}
        >
          <List.Dropdown.Item title="All Projects" value="all" />
          <List.Dropdown.Item title="Favorites" value="favorites" />
          <List.Dropdown.Item title="Recent" value="recent" />
        </List.Dropdown>
      }
      throttle
    >
      {getFilteredProjects().map((project) => (
        <List.Item
          key={project.id}
          title={project.name}
          subtitle={project.path_with_namespace}
          icon={favorites.includes(project.id) ? Icon.Star : Icon.Circle}
          accessories={[
            {
              icon: favorites.includes(project.id) ? Icon.StarFilled : Icon.Star,
              tooltip: favorites.includes(project.id) ? "Remove from favorites" : "Add to favorites"
            }
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Select Project"
                icon={Icon.Forward}
                onAction={() => setSelectedProject(project)}
              />
              <Action
                title={favorites.includes(project.id) ? "Remove from Favorites" : "Add to Favorites"}
                icon={favorites.includes(project.id) ? Icon.StarFilled : Icon.Star}
                onAction={() => handleToggleFavorite(project.id)}
              />
              <Action.OpenInBrowser url={project.web_url} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}