// Motoren bag alle tekstværktøjerne. Hver operation står ÉT sted her, og
// hver /tools-side vælger sin egen som hovedoperation. Retter man en fejl her,
// er den rettet på alle siderne.
//
// Hvorfor operationerne også kan kædes: på konkurrerende sider skal man hente
// en ny side for hver handling og kopiere teksten imellem. Her kan man fjerne
// dubletter OG sortere OG trimme mellemrum på én gang. Det er den eneste grund
// til at nogen ville vælge vores side frem for deres.

export type OptionType = 'checkbox' | 'text' | 'select';

export interface OptionDef {
  id: string;
  label: string;
  type: OptionType;
  default?: string | boolean;
  placeholder?: string;
  choices?: { value: string; label: string }[];
  /** Hjælpetekst under feltet */
  hint?: string;
}

export interface Operation {
  id: string;
  /** Navnet i kæde-panelet */
  label: string;
  options: OptionDef[];
  run: (lines: string[], opts: Record<string, string | boolean>, raw: string) => string[];
}

// Alle operationer arbejder på linjer. Enkelte har brug for den rå tekst
// (fx søg og erstat på tværs af linjeskift) og får den som tredje argument.

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const OPERATIONS: Record<string, Operation> = {
  'remove-duplicate-lines': {
    id: 'remove-duplicate-lines',
    label: 'Remove duplicate lines',
    options: [
      { id: 'ignoreCase', label: 'Ignore capitalisation', type: 'checkbox', default: false },
      { id: 'trimFirst', label: 'Ignore leading and trailing spaces when comparing', type: 'checkbox', default: true },
      { id: 'keepLast', label: 'Keep the last copy instead of the first', type: 'checkbox', default: false },
    ],
    run: (lines, o) => {
      const key = (l: string) => {
        let k = o.trimFirst ? l.trim() : l;
        return o.ignoreCase ? k.toLowerCase() : k;
      };
      if (o.keepLast) {
        const seen = new Set<string>();
        const out: string[] = [];
        for (let i = lines.length - 1; i >= 0; i--) {
          const k = key(lines[i]);
          if (seen.has(k)) continue;
          seen.add(k);
          out.unshift(lines[i]);
        }
        return out;
      }
      const seen = new Set<string>();
      return lines.filter((l) => {
        const k = key(l);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    },
  },

  'sort-list': {
    id: 'sort-list',
    label: 'Sort lines',
    options: [
      {
        id: 'order', label: 'Order', type: 'select', default: 'az',
        choices: [
          { value: 'az', label: 'A to Z' },
          { value: 'za', label: 'Z to A' },
          { value: 'numeric', label: 'Smallest number first' },
          { value: 'numericDesc', label: 'Largest number first' },
          { value: 'length', label: 'Shortest line first' },
          { value: 'lengthDesc', label: 'Longest line first' },
          { value: 'reverse', label: 'Reverse current order' },
          { value: 'random', label: 'Random shuffle' },
        ],
      },
      { id: 'ignoreCase', label: 'Ignore capitalisation', type: 'checkbox', default: true },
    ],
    run: (lines, o) => {
      const arr = [...lines];
      const order = String(o.order || 'az');
      if (order === 'reverse') return arr.reverse();
      if (order === 'random') {
        // Fisher-Yates: hver rækkefølge er lige sandsynlig. En sort() med
        // tilfældig comparator er IKKE tilfældig og giver skæve resultater.
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }
      const num = (l: string) => { const m = l.match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
      const cmpText = (a: string, b: string) =>
        (o.ignoreCase ? a.toLowerCase() : a).localeCompare(o.ignoreCase ? b.toLowerCase() : b, undefined, { numeric: true });
      if (order === 'az') return arr.sort(cmpText);
      if (order === 'za') return arr.sort((a, b) => cmpText(b, a));
      if (order === 'length') return arr.sort((a, b) => a.length - b.length);
      if (order === 'lengthDesc') return arr.sort((a, b) => b.length - a.length);
      // Linjer uden tal lægges bagerst i stedet for at havne tilfældigt
      const byNum = (a: string, b: string, dir: number) => {
        const na = num(a), nb = num(b);
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return (na - nb) * dir;
      };
      return arr.sort((a, b) => byNum(a, b, order === 'numeric' ? 1 : -1));
    },
  },

  'remove-empty-lines': {
    id: 'remove-empty-lines',
    label: 'Remove empty lines',
    options: [
      { id: 'whitespaceCounts', label: 'Treat lines with only spaces or tabs as empty', type: 'checkbox', default: true },
      { id: 'collapse', label: 'Keep one blank line instead of removing all', type: 'checkbox', default: false },
    ],
    run: (lines, o) => {
      const isEmpty = (l: string) => (o.whitespaceCounts ? l.trim() === '' : l === '');
      if (!o.collapse) return lines.filter((l) => !isEmpty(l));
      const out: string[] = [];
      let lastWasEmpty = false;
      for (const l of lines) {
        if (isEmpty(l)) {
          if (!lastWasEmpty) out.push('');
          lastWasEmpty = true;
        } else {
          out.push(l);
          lastWasEmpty = false;
        }
      }
      // Ingen grund til at efterlade en tom linje i toppen eller bunden
      while (out.length && out[0] === '') out.shift();
      while (out.length && out[out.length - 1] === '') out.pop();
      return out;
    },
  },

  'find-and-replace': {
    id: 'find-and-replace',
    label: 'Find and replace',
    options: [
      { id: 'find', label: 'Find', type: 'text', default: '', placeholder: 'text to look for' },
      { id: 'replace', label: 'Replace with', type: 'text', default: '', placeholder: 'leave empty to delete it' },
      { id: 'matchCase', label: 'Match capitalisation', type: 'checkbox', default: false },
      { id: 'wholeWord', label: 'Whole words only', type: 'checkbox', default: false },
      {
        id: 'regex', label: 'Treat "Find" as a regular expression', type: 'checkbox', default: false,
        hint: 'For advanced patterns. An invalid pattern leaves your text untouched rather than erroring.',
      },
    ],
    run: (lines, o) => {
      const find = String(o.find ?? '');
      if (!find) return lines;
      const replace = String(o.replace ?? '');
      let pattern = o.regex ? find : escapeRegex(find);
      if (o.wholeWord) pattern = `\\b(?:${pattern})\\b`;
      let re: RegExp;
      try {
        re = new RegExp(pattern, o.matchCase ? 'g' : 'gi');
      } catch {
        return lines; // ugyldigt mønster: lad teksten være i fred
      }
      return lines.map((l) => l.replace(re, replace));
    },
  },

  'trim-whitespace': {
    id: 'trim-whitespace',
    label: 'Clean up spaces',
    options: [
      { id: 'trimEnds', label: 'Remove spaces at the start and end of each line', type: 'checkbox', default: true },
      { id: 'collapseInner', label: 'Collapse repeated spaces inside a line into one', type: 'checkbox', default: true },
      { id: 'tabsToSpaces', label: 'Convert tabs to spaces', type: 'checkbox', default: false },
    ],
    run: (lines, o) => lines.map((l) => {
      let out = l;
      if (o.tabsToSpaces) out = out.replace(/\t/g, '  ');
      if (o.collapseInner) out = out.replace(/[ \t]{2,}/g, ' ');
      if (o.trimEnds) out = out.trim();
      return out;
    }),
  },
};

export const OPERATION_LIST = Object.values(OPERATIONS);
