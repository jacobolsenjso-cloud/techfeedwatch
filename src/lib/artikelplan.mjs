// Artikelplan (12/10-2026, Jacob sagde ja): to forbedringer hentet fra SEOwriting.ai's idéer.
//
// 1) OUTLINE FØR TEKST. Før skrev robotten overskrifter og tekst i ét kald. Nu laves
//    overskrifterne først, ud fra søgningens delspørgsmål, og tjekkes (dækker hvert
//    delspørgsmål, ingen skabelonoverskrifter, videoafsnittet nævner kanalen). Først derefter
//    skrives teksten efter dem. Fase C målte 65 % overskrifter, der svarer på søgningen.
// 2) FAQ FRA RIGTIGE SØGNINGER. Spørgsmålene tages fra Googles autocomplete (det folk
//    faktisk skriver) i stedet for at Gemini finder på dem.
//
// Fejler noget, falder robotten tilbage til det gamle (ét kald, Geminis egne FAQ) — et
// fejlende trin må aldrig stoppe en artikel, der ellers er god.
import { GEMINI_MODEL, hentModel } from './model.mjs';
import { erVideoOverskrift } from './kildetjek.mjs';

// Skabelonoverskrifter, der står ens i mange artikler (et signal om masseproduceret indhold)
export const SKABELON = /^(how it works|what it is|who it'?s for|key takeaways|the bottom line|bottom line|conclusion|introduction|overview|final thoughts|faqs?|summary|wrapping up|in summary)$/i;

export function outlinePrompt({ spoergsmaal, delspoergsmaal, faktaTekst, kanal, videoKort }) {
  return `Plan the "## " headings of an article that answers the Google search "${spoergsmaal}".

RESEARCH QUESTIONS (question 1 is answered by the article's opening paragraph, which has no heading):
${delspoergsmaal.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RESEARCH FACTS (for orientation):
${faktaTekst}

VIDEO: the article has one section about a video by "${kanal}". What the video covers:
${videoKort}

Return JSON only: {"sections":[{"h2":"...","covers":[2]}],"video":"...","closing":""}
Rules:
- 3 to 6 sections, in the order a reader needs them. Together they must cover EVERY research question from 2 to ${delspoergsmaal.length}; list the numbers each section answers in "covers".
- About HALF of the h2s (at least 1, never all) are the question a reader would type, in plain natural English ending with "?" (for example "What are security requirements?"). The others are short, direct statements of the answer. Never an abstract noun phrase such as "The Core Principles Underlying ..." or "Key Considerations for ...". (15/10-2026, Jacob: spørgsmål i overskrifterne, svar i første sætning.)
- Each h2 is specific to this subject. At most 10 words. Never a template heading such as "How It Works", "What It Is", "Who It's For", "Key Takeaways", "The Bottom Line", "Conclusion", "Overview" or "FAQ". Do not start several headings with the same words.
- "video": the heading of the video section. It must contain the creator's name "${kanal}" and say specifically what the video shows.
- "closing": the heading of a short practical closing section, or "" if the article does not need one.`;
}

// Tjekker en plan. Returnerer en liste med fejl (tom = godkendt).
export function tjekOutline(o, delspoergsmaal, channelTitle) {
  const fejl = [];
  const sek = Array.isArray(o?.sections) ? o.sections : [];
  if (sek.length < 3 || sek.length > 6) fejl.push(`${sek.length} afsnit (3-6)`);
  const daekket = new Set(sek.flatMap((s) => (Array.isArray(s.covers) ? s.covers : []).map(Number)));
  const mangler = delspoergsmaal.map((_, i) => i + 1).filter((n) => n >= 2 && !daekket.has(n));
  if (mangler.length) fejl.push(`delspørgsmål ${mangler.join(', ')} ikke dækket`);
  const alle = sek.map((s) => String(s.h2 || '').replace(/^#+\s*/, '').trim());
  for (const h of alle) {
    if (!h) fejl.push('tom overskrift');
    else if (SKABELON.test(h.replace(/[.:!?]$/, ''))) fejl.push(`skabelon: "${h}"`);
    else if (h.split(/\s+/).length > 14) fejl.push(`for lang: "${h}"`);
  }
  if (new Set(alle.map((h) => h.toLowerCase())).size !== alle.length) fejl.push('samme overskrift to gange');
  // 15/10: cirka halvdelen som spørgsmål — mindst ét, aldrig alle (ens spørgsmåls-skabelon er også et mønster).
  const spm = alle.filter((h) => /\?\s*$/.test(h)).length;
  if (alle.length && spm === 0) fejl.push('ingen overskrift er et spørgsmål');
  if (alle.length >= 3 && spm === alle.length) fejl.push('alle overskrifter er spørgsmål');
  if (!erVideoOverskrift(String(o?.video || ''), channelTitle)) fejl.push('videooverskriften nævner ikke kanalen');
  return fejl;
}

// Laver planen (to forsøg). Returnerer null, hvis ingen plan bestod — så skrives som før.
export async function lavOutline(genAI, args, channelTitle, log = console.log) {
  for (let forsoeg = 1; forsoeg <= 2; forsoeg++) {
    try {
      const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 4096, temperature: 0.3, responseMimeType: 'application/json' } }).generateContent(outlinePrompt(args));
      const o = JSON.parse((r.response.text() || '').replace(/^```(json)?\s*|\s*```$/g, ''));
      const fejl = tjekOutline(o, args.delspoergsmaal, channelTitle);
      if (!fejl.length) {
        const ren = (h) => String(h || '').replace(/^#+\s*/, '').trim();
        const plan = { sections: o.sections.map((s) => ren(s.h2)), video: ren(o.video), closing: ren(o.closing) };
        log(`🗂️ Outline: ${plan.sections.length} afsnit + video${plan.closing ? ' + afslutning' : ''} (forsøg ${forsoeg})`);
        return plan;
      }
      log(`🗂️ Outline forsøg ${forsoeg} afvist: ${fejl.join(' · ')}`);
    } catch (e) { log(`🗂️ Outline forsøg ${forsoeg} fejlede: ${String(e.message).split('\n')[0]}`); }
  }
  log('🗂️ Outline: ingen plan bestod — artiklen skrives med overskrifter fra ét kald som før');
  return null;
}

// Til artikel-promptens STRUCTURE-afsnit.
export function strukturTekst(plan) {
  return `- Then EXACTLY these "## " sections, with these headings word for word, in this order:
${plan.sections.map((h) => `      ## ${h}`).join('\n')}
    - Then the video section (rule 14), with exactly this heading:
      ## ${plan.video}
${plan.closing ? `    - Then a short closing section with practical guidance, with exactly this heading:\n      ## ${plan.closing}\n` : ''}`;
}

// Hvor mange af planens overskrifter står i den færdige artikel? (måling til loggen)
export function outlineBrugt(md, plan) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const h2 = new Set((String(md).match(/^##\s+.+$/gm) || []).map((l) => norm(l.replace(/^##\s+/, ''))));
  const alle = [...plan.sections, plan.video, ...(plan.closing ? [plan.closing] : [])];
  return { brugt: alle.filter((h) => h2.has(norm(h))).length, ialt: alle.length };
}

// FAQ: hvor mange af artiklens FAQ-spørgsmål er (næsten) en rigtig søgning? Ordoverlap >= 60 %.
export function faqFraSoegninger(faqs, soegninger) {
  const ord = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2));
  const S = soegninger.map(ord);
  return faqs.filter((f) => {
    const q = ord(f.question);
    return S.some((s) => { const faelles = [...s].filter((w) => q.has(w)).length; return s.size && faelles / s.size >= 0.6; });
  }).length;
}
