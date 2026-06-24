export type AgentCategory =
  | "chat"
  | "voice"
  | "vision"
  | "research"
  | "productivity"
  | "business"
  | "developer";

export type AgentDefinition = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: AgentCategory;
  accent: string;
  featured?: boolean;
  capabilities: string[];
};

export const agentCatalog: AgentDefinition[] = [
  {
    id: "nova-chat",
    name: "NovaChat",
    tagline: "Conversational AI for support and content",
    description: "A versatile chat agent for assistance, customer support, and content generation workflows.",
    category: "chat",
    accent: "from-cyan-200 via-sky-300 to-blue-500",
    featured: true,
    capabilities: ["Chat", "Support", "Content", "Automation"]
  },
  {
    id: "echo-scribe",
    name: "EchoScribe",
    tagline: "Voice-to-text with structured notes",
    description: "Transcribes meetings, calls, and lectures into searchable notes and highlights.",
    category: "voice",
    accent: "from-emerald-200 via-teal-300 to-cyan-500",
    capabilities: ["Transcription", "Speaker Notes", "Summaries"]
  },
  {
    id: "vox-ai",
    name: "VoxAI",
    tagline: "Natural text-to-speech across languages",
    description: "Converts text into expressive voice output with multilingual support.",
    category: "voice",
    accent: "from-fuchsia-200 via-pink-300 to-rose-500",
    capabilities: ["TTS", "Voice Cloning", "Multi-language"]
  },
  {
    id: "vision-craft",
    name: "VisionCraft",
    tagline: "Generate visuals from prompts",
    description: "Turns prompt ideas into product art, marketing concepts, and creative assets.",
    category: "vision",
    accent: "from-amber-200 via-orange-300 to-red-500",
    featured: true,
    capabilities: ["Image Generation", "Styles", "Concept Art"]
  },
  {
    id: "image-reader",
    name: "ImageReader",
    tagline: "OCR for files and screenshots",
    description: "Extracts text and structure from images, invoices, and scanned documents.",
    category: "vision",
    accent: "from-slate-200 via-zinc-300 to-stone-500",
    capabilities: ["OCR", "Extraction", "Documents"]
  },
  {
    id: "deep-search",
    name: "DeepSearch",
    tagline: "Research agent for the web",
    description: "Finds, synthesizes, and summarizes information from multiple sources for rapid research.",
    category: "research",
    accent: "from-lime-200 via-green-300 to-emerald-500",
    featured: true,
    capabilities: ["Research", "Summaries", "Source Notes"]
  },
  {
    id: "code-pilot",
    name: "CodePilot",
    tagline: "Coding help for build, debug, and explain",
    description: "Supports developers with generation, debugging, refactors, and technical explanations.",
    category: "developer",
    accent: "from-violet-200 via-indigo-300 to-blue-600",
    capabilities: ["Code Gen", "Debugging", "Reviews"]
  },
  {
    id: "note-flow",
    name: "NoteFlow",
    tagline: "Meeting notes that stay actionable",
    description: "Converts conversations into structured takeaways, action items, and status updates.",
    category: "productivity",
    accent: "from-cyan-100 via-slate-200 to-sky-500",
    capabilities: ["Notes", "Tasks", "Summaries"]
  },
  {
    id: "translate-ai",
    name: "TranslateAI",
    tagline: "Context-aware multilingual translation",
    description: "Delivers fast translations optimized for business, product, and support use cases.",
    category: "productivity",
    accent: "from-yellow-100 via-amber-300 to-orange-500",
    capabilities: ["Translation", "Localization", "Tone"]
  },
  {
    id: "content-forge",
    name: "ContentForge",
    tagline: "Long-form and campaign content engine",
    description: "Creates blogs, social posts, ad copy, landing page text, and editorial outlines.",
    category: "business",
    accent: "from-rose-200 via-pink-300 to-fuchsia-500",
    capabilities: ["Blogs", "Ads", "Campaign Copy"]
  },
  {
    id: "resume-ai",
    name: "ResumeAI",
    tagline: "Resumes and cover letters tailored faster",
    description: "Builds role-specific resumes, cover letters, and achievement-focused rewrites.",
    category: "productivity",
    accent: "from-blue-100 via-cyan-200 to-teal-500",
    capabilities: ["Resume", "Cover Letter", "ATS"]
  },
  {
    id: "email-genius",
    name: "EmailGenius",
    tagline: "Professional email drafting assistant",
    description: "Writes concise, persuasive, and context-appropriate emails for work communication.",
    category: "business",
    accent: "from-stone-100 via-neutral-200 to-zinc-500",
    capabilities: ["Email", "Reply Drafts", "Follow-ups"]
  },
  {
    id: "pdf-mind",
    name: "PDFMind",
    tagline: "Chat with documents and reports",
    description: "Indexes uploaded PDFs and answers questions with grounded references to the source.",
    category: "research",
    accent: "from-red-100 via-orange-200 to-amber-500",
    capabilities: ["PDF QA", "Extraction", "Insights"]
  },
  {
    id: "data-insight",
    name: "DataInsight",
    tagline: "Spreadsheet and CSV analysis",
    description: "Analyzes tabular files, finds anomalies, and explains patterns in business language.",
    category: "business",
    accent: "from-emerald-100 via-green-300 to-lime-500",
    capabilities: ["CSV", "Excel", "Analysis"]
  },
  {
    id: "vision-describe",
    name: "VisionDescribe",
    tagline: "Captioning and visual understanding",
    description: "Generates image descriptions, scene understanding, and accessibility-ready captions.",
    category: "vision",
    accent: "from-sky-100 via-cyan-300 to-blue-500",
    capabilities: ["Captioning", "Scene QA", "Accessibility"]
  },
  {
    id: "video-script",
    name: "VideoScript",
    tagline: "Scripts for reels, explainers, and demos",
    description: "Writes short-form and long-form video scripts with hooks, pacing, and calls to action.",
    category: "business",
    accent: "from-orange-100 via-amber-300 to-yellow-500",
    capabilities: ["Hooks", "Scripts", "Storyboards"]
  },
  {
    id: "prompt-forge",
    name: "PromptForge",
    tagline: "Prompt engineering for better outputs",
    description: "Designs system prompts, chains, and guardrails for production AI applications.",
    category: "developer",
    accent: "from-indigo-100 via-violet-300 to-fuchsia-500",
    capabilities: ["Prompts", "Evaluation", "Optimization"]
  },
  {
    id: "agent-builder",
    name: "AgentBuilder",
    tagline: "No-code workflows for custom agents",
    description: "Lets teams compose triggers, prompts, tools, and outputs into deployable agents.",
    category: "developer",
    accent: "from-teal-100 via-cyan-300 to-sky-500",
    featured: true,
    capabilities: ["No-Code", "Workflows", "Custom Agents"]
  },
  {
    id: "voice-bot",
    name: "VoiceBot",
    tagline: "Low-latency voice AI assistant",
    description: "Enables conversational voice experiences for support, sales, and operations.",
    category: "voice",
    accent: "from-purple-100 via-indigo-300 to-violet-500",
    capabilities: ["Realtime Voice", "Assistants", "Telephony"]
  },
  {
    id: "interview-ai",
    name: "InterviewAI",
    tagline: "Mock interviews and career prep",
    description: "Runs realistic interviews, evaluates responses, and suggests targeted improvement areas.",
    category: "productivity",
    accent: "from-amber-100 via-yellow-300 to-lime-500",
    capabilities: ["Mock Interview", "Feedback", "Practice"]
  },
  {
    id: "study-mate",
    name: "StudyMate",
    tagline: "Learning support for students and teams",
    description: "Explains concepts, creates revision plans, and generates quizzes from source material.",
    category: "productivity",
    accent: "from-cyan-100 via-blue-200 to-indigo-500",
    capabilities: ["Tutoring", "Quizzes", "Study Plans"]
  },
  {
    id: "legal-assist",
    name: "LegalAssist",
    tagline: "Draft and review legal documents",
    description: "Supports contract drafting, clause review, and legal-first document workflows.",
    category: "business",
    accent: "from-slate-100 via-stone-300 to-zinc-600",
    capabilities: ["Contracts", "Clauses", "Review"]
  },
  {
    id: "finance-gpt",
    name: "FinanceGPT",
    tagline: "Finance and investment analysis",
    description: "Summarizes financial data, compares scenarios, and explains metrics with clarity.",
    category: "business",
    accent: "from-green-100 via-emerald-300 to-teal-600",
    capabilities: ["Finance", "Comparisons", "Forecasts"]
  },
  {
    id: "market-mind",
    name: "MarketMind",
    tagline: "Competitive and market research",
    description: "Builds competitor snapshots, GTM research summaries, and segment opportunity maps.",
    category: "research",
    accent: "from-sky-100 via-indigo-200 to-violet-500",
    capabilities: ["Competitors", "Markets", "GTM"]
  },
  {
    id: "social-pilot",
    name: "SocialPilot",
    tagline: "Plan and generate social media content",
    description: "Creates content calendars, post drafts, and channel-specific repurposing suggestions.",
    category: "business",
    accent: "from-pink-100 via-rose-200 to-orange-500",
    capabilities: ["Calendars", "Posts", "Repurposing"]
  },
  {
    id: "seo-forge",
    name: "SEOForge",
    tagline: "SEO optimization with keyword strategy",
    description: "Finds keyword clusters, improves structure, and strengthens ranking-oriented content.",
    category: "business",
    accent: "from-lime-100 via-emerald-200 to-green-500",
    capabilities: ["SEO", "Keywords", "Optimization"]
  },
  {
    id: "startup-mentor",
    name: "StartupMentor",
    tagline: "Business strategy for early teams",
    description: "Helps founders shape pricing, positioning, GTM plans, and launch execution.",
    category: "business",
    accent: "from-blue-100 via-slate-200 to-cyan-500",
    capabilities: ["Strategy", "Pricing", "Positioning"]
  },
  {
    id: "design-mind",
    name: "DesignMind",
    tagline: "UI and UX critique assistant",
    description: "Reviews interfaces, suggests improvements, and helps teams refine design direction.",
    category: "vision",
    accent: "from-fuchsia-100 via-purple-200 to-indigo-500",
    capabilities: ["UI Review", "UX Notes", "Heuristics"]
  },
  {
    id: "sales-copilot",
    name: "SalesCopilot",
    tagline: "Sales outreach and lead assistance",
    description: "Generates prospecting sequences, lead research, and personalized outreach copy.",
    category: "business",
    accent: "from-orange-100 via-red-200 to-pink-500",
    capabilities: ["Outreach", "Lead Research", "Sequences"]
  },
  {
    id: "agent-api-hub",
    name: "Agent API Hub",
    tagline: "Unified API access across agents",
    description: "One programmable entrypoint for invoking the AgentVerse ecosystem from products and workflows.",
    category: "developer",
    accent: "from-slate-100 via-cyan-200 to-blue-500",
    featured: true,
    capabilities: ["API", "SDK", "Integrations"]
  }
];

