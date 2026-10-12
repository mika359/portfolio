import type { Metadata } from "next";
import ProjectsView from "@/components/ProjectsView";

export const metadata: Metadata = {
  title: "Projects — Mykhaylo",
  description: "Selected cybersecurity and development projects by Mykhaylo.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
