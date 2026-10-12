// Content of the two CVs (PT and EN), mirrored from the original PDFs in public/downloads/.
// The PDFs are what people download; this data only feeds the styled /cv page.
export type CvLang = "pt" | "en";

export type CvBlock =
  | { kind: "paragraphs"; title: string; items: string[] }
  | { kind: "facts"; title: string; items: { label: string; value: string }[] }
  | { kind: "entries"; title: string; items: { heading: string; meta?: string; place?: string; text?: string }[] }
  | { kind: "bullets"; title: string; items: { label?: string; text: string }[] };

export interface CvData {
  file: string;
  blocks: CvBlock[];
}

export const CV_PUBLIC = {
  email: "mykhaylo359@gmail.com",
  linkedin: { label: "linkedin.com/in/mykhaylo359", href: "https://www.linkedin.com/in/mykhaylo359" },
  github: { label: "github.com/mika359", href: "https://github.com/mika359" },
  city: "Lisbon, Portugal",
};

export const cv: Record<CvLang, CvData> = {
  en: {
    file: "/downloads/Mykhaylo_Levytskyy_CV_en.pdf",
    blocks: [
      {
        kind: "paragraphs",
        title: "Profile",
        items: [
          "Information Technology graduate from the Faculty of Sciences, University of Lisbon, with a strong interest in information security and cybersecurity. My academic projects gave me hands-on experience with secure client-server applications, TLS, encryption, digital signatures and message authentication.",
          "My background in software development and computer networks helps me understand how IT systems work and how security controls can be applied to protect them. I enjoy investigating how systems behave, identifying potential weaknesses, understanding their causes, and finding practical ways to address them.",
          "I am now looking to start my career in information security, with a particular interest in cybersecurity assessments, IT risk, and security controls.",
        ],
      },
      {
        kind: "entries",
        title: "Education",
        items: [
          {
            heading: "Bachelor's in Information Technology",
            meta: "Graduated January 2026",
            place: "Faculty of Sciences, University of Lisbon",
            text: "Relevant courses: Information Security, Computer Networks, Operating Systems, Databases, Computer Architecture, Software and Service Design, Web Technologies, Object-Oriented Programming, Machine Learning Fundamentals.",
          },
        ],
      },
      {
        kind: "facts",
        title: "Skills",
        items: [
          { label: "Security", value: "TLS, symmetric and asymmetric encryption, digital signatures, message authentication codes (MACs), secure client-server design, basic security testing. Currently learning: IT risk management, IT general controls." },
          { label: "Networks", value: "TCP/IP, DNS, HTTP, IPv4/IPv6, traffic analysis with Wireshark." },
          { label: "Systems and tools", value: "Linux (Ubuntu), Git, GitHub, Microsoft Azure (basic), VS Code." },
          { label: "Programming", value: "Python, Java, JavaScript, Django, Spring, REST APIs. Databases: MySQL, MongoDB." },
        ],
      },
      {
        kind: "facts",
        title: "Languages",
        items: [
          { label: "Ukrainian", value: "Native" },
          { label: "Portuguese", value: "Advanced" },
          { label: "English", value: "Professional working proficiency" },
        ],
      },
      {
        kind: "bullets",
        title: "Academic projects",
        items: [
          { label: "Information Security", text: "Built client-server applications that communicate over TLS and use cryptographic ciphers and digital signatures. Used MACs to detect tampering with data stored on the server, then tested the system for weak points." },
          { label: "Computer Networks", text: "Captured and analysed traffic in Wireshark to follow how connections open, how packets move and how protocols such as TCP, DNS and HTTP behave in practice." },
          { label: "Human-Computer Interaction", text: "Interviewed users about how they worked, designed an interface around what they needed and changed it based on their feedback." },
          { label: "Software Component Construction", text: "Worked in a team using Git and Agile practices, taking part in planning, development and review." },
          { label: "REST APIs (Distributed Applications, IT Project)", text: "Built a REST API in Django and a client that talks to a REST service." },
        ],
      },
      {
        kind: "bullets",
        title: "Personal project",
        items: [
          { label: "Event website", text: "Built and put online a website for an event, in two languages, with a guest registration form that saves entries automatically and an OpenStreetMap location map. HTML, CSS, JavaScript, Bootstrap." },
        ],
      },
      {
        kind: "bullets",
        title: "Other experience",
        items: [{ text: "Property Maintenance and Church Assistant (12+ years)" }, { text: "Freelance Gardening and Landscaping" }],
      },
      {
        kind: "bullets",
        title: "Courses",
        items: [{ text: "Anthropic Academy: Claude 101 and Building with the Claude API (in progress)" }],
      },
    ],
  },
  pt: {
    file: "/downloads/Mykhaylo_Levytskyy_CV_pt.pdf",
    blocks: [
      {
        kind: "paragraphs",
        title: "Resumo profissional",
        items: [
          "Licenciado em Tecnologias de Informação pela Faculdade de Ciências da Universidade de Lisboa. Procuro uma oportunidade na área de Informática para aplicar os conhecimentos adquiridos durante a licenciatura e ganhar experiência profissional.",
          "Tenho conhecimentos de sistemas operativos, redes, bases de dados e programação. Sou uma pessoa responsável, organizada e assídua, com facilidade em trabalhar em equipa.",
        ],
      },
      {
        kind: "facts",
        title: "Competências técnicas",
        items: [
          { label: "Sistemas Operativos", value: "Windows, Ubuntu (Linux)." },
          { label: "Redes e Segurança", value: "Comunicação cliente/servidor, REST APIs, protocolo TLS, cifras, assinaturas digitais e MAC." },
          { label: "Programação", value: "Java, Python, JavaScript." },
          { label: "Frameworks", value: "Django, Spring." },
          { label: "Bases de Dados", value: "MySQL, MongoDB, NoSQL." },
          { label: "Ferramentas", value: "Git, GitHub, VS Code." },
          { label: "Conceitos", value: "Programação Orientada a Objetos, Estruturas de Dados e Algoritmos, Metodologias Ágeis." },
        ],
      },
      {
        kind: "facts",
        title: "Idiomas",
        items: [
          { label: "Ucraniano", value: "Nativo" },
          { label: "Português", value: "Avançado" },
          { label: "Inglês", value: "Proficiência profissional de trabalho" },
        ],
      },
      {
        kind: "entries",
        title: "Formação académica",
        items: [
          {
            heading: "Licenciatura em Tecnologias de Informação",
            meta: "Concluída em janeiro de 2026",
            place: "Faculdade de Ciências da Universidade de Lisboa",
            text: "Unidades curriculares relevantes: Redes Informáticas, Sistemas de Bases de Dados, Engenharia de Software, Desenvolvimento Web.",
          },
        ],
      },
      {
        kind: "bullets",
        title: "Projetos universitários",
        items: [
          { label: "Segurança Informática (Java)", text: "Desenvolvimento de componentes cliente/servidor com mecanismos de segurança (cifras, assinaturas digitais e protocolo TLS), garantia da integridade dos dados através de MAC e realização de testes." },
          { label: "Construção de Componentes de Software", text: "Desenvolvimento de uma solução de software em Java, em equipa, com recurso a Git e metodologia Agile." },
          { label: "Projeto de Tecnologias de Informação", text: "Desenvolvimento de uma API REST para uma aplicação web com Django." },
          { label: "Aplicações Distribuídas (Java)", text: "Desenvolvimento de código cliente para interação com um website através de uma API REST." },
          { label: "Interação Computador", text: "Análise de utilizadores e tarefas, conceção de interfaces centradas no utilizador e melhoria contínua com base em feedback." },
        ],
      },
      {
        kind: "bullets",
        title: "Projetos pessoais",
        items: [
          { text: "Desenvolvimento de um website responsivo para eventos, com HTML, CSS, JavaScript e Bootstrap, com suporte multilingue (2 idiomas)." },
          { text: "Criação de um sistema de registo de convidados com armazenamento automático de dados no Google Sheets." },
          { text: "Integração do OpenStreetMap para apresentação da localização e da informação do local do evento." },
        ],
      },
      {
        kind: "entries",
        title: "Experiência complementar",
        items: [
          {
            heading: "Assistente de Manutenção e Apoio a Igreja",
            meta: "Mais de 12 anos",
            text: "Responsável pela abertura, encerramento e preparação das instalações e equipamentos para serviços e eventos, garantindo a sua organização e limpeza, com assiduidade e sentido de responsabilidade.",
          },
        ],
      },
    ],
  },
};
