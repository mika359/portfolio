// Real projects have tags/code/demo; entries with `soon: true` only show their category and a centred "Soon".
// Titles/descriptions of real projects live in src/i18n/*.json (projects.items.<id>).
export interface Project {
  id: string;
  category: "security" | "dev";
  soon?: boolean;
  tags?: string[];
  code?: string;
  demo?: string;
}

export const projects: Project[] = [
  { id: "site", category: "dev", tags: ["Next.js", "TypeScript", "Tailwind"], code: "https://github.com/mika359/portfolio", demo: "/" },
  // Placeholder links: replace code/demo with the real wedding site and repository.
  { id: "wedding", category: "dev", tags: ["HTML", "CSS", "JavaScript", "Bootstrap", "OpenStreetMap"], code: "https://github.com/mika359", demo: "#" },
  { id: "scanner", category: "security", soon: true },
  { id: "ctf", category: "security", soon: true },
  { id: "lab", category: "security", soon: true },
  { id: "auditor", category: "security", soon: true },
  { id: "api", category: "dev", soon: true },
];
