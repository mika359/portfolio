// Placeholder projects: edit freely. Titles/descriptions live in src/i18n/*.json (projects.items.<id>).
export interface Project {
  id: string;
  category: "security" | "dev";
  tags: string[];
  code: string;
  demo?: string;
}

export const projects: Project[] = [
  { id: "scanner", category: "security", tags: ["Python", "Networking", "Sockets"], code: "https://github.com/" },
  { id: "ctf", category: "security", tags: ["CTF", "Web", "Crypto", "Forensics"], code: "https://github.com/" },
  { id: "lab", category: "security", tags: ["Docker", "OWASP", "PHP"], code: "https://github.com/" },
  { id: "auditor", category: "security", tags: ["Python", "CLI", "Hashing"], code: "https://github.com/" },
  { id: "site", category: "dev", tags: ["Next.js", "TypeScript", "Tailwind"], code: "https://github.com/", demo: "/" },
  { id: "api", category: "dev", tags: ["Node.js", "REST", "JWT", "Tests"], code: "https://github.com/" },
];
