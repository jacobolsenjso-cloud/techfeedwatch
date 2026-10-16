// AI-priser ét sted (flyttet hertil 16/10-2026 fra ai-token-calculator.astro, så token-beregneren
// og "AI Subscription vs API" altid viser de samme tal).
//
// API: pris pr. 1M tokens i USD, udbydernes standardpris (ikke batch, cache eller "fast mode").
// Læst ordret fra de tre officielle prissider 24/9-2026. Når tallene ændres: ret dem her OG sæt
// `updated` på BEGGE værktøjer i src/lib/tools.ts.
// `skift`: en pris, udbyderen selv har meldt ændres på en bestemt dato; browseren vælger ud fra dags dato.
export const MODEL_PRICING = [
  { provider: 'OpenAI', name: 'GPT-6 Astra', input: 10, output: 50, note: 'Short-context rate' },
  { provider: 'OpenAI', name: 'GPT-6 Sol', input: 2, output: 10, note: 'Short-context rate' },
  { provider: 'OpenAI', name: 'GPT-6 Luna', input: 0.10, output: 0.50, note: 'Short-context rate' },
  { provider: 'Anthropic', name: 'Claude Fable 5.1', input: 10, output: 50 },
  { provider: 'Anthropic', name: 'Claude Opus 5.5', input: 4, output: 20 },
  { provider: 'Anthropic', name: 'Claude Sonnet 5', input: 2, output: 10 },
  { provider: 'Anthropic', name: 'Claude Haiku 4.5', input: 1, output: 5 },
  { provider: 'Google', name: 'Gemini 3.1 Pro (preview)', input: 2, output: 12, note: 'Prompts up to 200k tokens' },
  { provider: 'Google', name: 'Gemini 3.8 Flash', input: 0.75, output: 3.75, note: 'Rises to $1.50 / $7.50 on Jan 1, 2027',
    skift: { dato: '2027-01-01', input: 1.50, output: 7.50, note: 'Rate from Jan 1, 2027' } },
  { provider: 'Google', name: 'Gemini 3.1 Flash-Lite', input: 0.25, output: 1.50 },
];

export const PRIS_KILDER = [
  { name: 'OpenAI', url: 'https://developers.openai.com/api/docs/pricing' },
  { name: 'Anthropic', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
  { name: 'Google', url: 'https://ai.google.dev/gemini-api/docs/pricing' },
];

// Abonnementer (USD/måned, månedlig betaling). Læst på udbydernes egne sider 16/10-2026.
// ChatGPT Plus er IKKE med: chatgpt.com/pricing viste ingen pris i teksten den dag (vises
// som billede/efter land) - hellere intet tal end et gættet.
export const ABONNEMENTER = [
  { name: 'Claude Pro (monthly billing)', pris: 20, url: 'https://claude.com/pricing' },
  { name: 'Google AI Pro', pris: 19.99, url: 'https://gemini.google/subscriptions/' },
];
export const ABONNEMENT_TJEKKET = '2026-10-16';
