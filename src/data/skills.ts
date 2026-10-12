// Skills taken from the CV. Category titles are translated in src/i18n/*.json (skills.<id>).
export const skills: { id: "security" | "dev" | "network" | "tools"; items: string[] }[] = [
  { id: "security", items: ["TLS", "Encryption", "Digital signatures", "MACs", "Secure client-server", "Security testing"] },
  { id: "dev", items: ["Python", "Java", "JavaScript", "Django", "Spring", "REST APIs", "MySQL", "MongoDB"] },
  { id: "network", items: ["TCP/IP", "DNS", "HTTP", "IPv4/IPv6", "Wireshark", "Linux (Ubuntu)"] },
  { id: "tools", items: ["Git", "GitHub", "VS Code", "Microsoft Azure"] },
];
