import { EN_EXACT, EN_PATTERNS, EN_PHRASES } from './enDictionary';

/**
 * English safety net: while the site language is EN, Thai text that is still written without t(th, en)
 * is swapped for the English in enDictionary.ts — in the page, in alt / aria-label / title / placeholder,
 * and in anything React adds later. Switching back to TH puts the original text back.
 * Sentences written with t() never reach this code (they are already English).
 */
const THAI = /[฀-๿]/;
const ATTRS = ['alt', 'title', 'placeholder', 'aria-label'] as const;
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);

const originalText = new WeakMap<Text, { th: string; en: string }>();
const originalAttr = new WeakMap<Element, Record<string, { th: string; en: string }>>();

function toEnglish(raw: string): string | null {
  const lead = /^\s*/.exec(raw)![0];
  const trail = /\s*$/.exec(raw)![0];
  const core = raw.trim();
  if (!core) return null;
  const exact = EN_EXACT[core];
  if (exact !== undefined) return lead + exact + trail;
  for (const [re, fn] of EN_PATTERNS) {
    const m = re.exec(core);
    if (m) return lead + fn(m) + trail;
  }
  let out = core;
  for (const [th, en] of EN_PHRASES) out = out.split(th).join(en);
  return out !== core ? lead + out + trail : null;
}

function doText(node: Text) {
  const cur = node.nodeValue || '';
  if (!THAI.test(cur)) return;
  const en = toEnglish(cur);
  if (en === null || en === cur) return;
  originalText.set(node, { th: cur, en });
  node.nodeValue = en;
}

function doAttrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v || !THAI.test(v)) continue;
    const en = toEnglish(v);
    if (en === null || en === v) continue;
    const rec = originalAttr.get(el) || {};
    rec[a] = { th: v, en };
    originalAttr.set(el, rec);
    el.setAttribute(a, en);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!SKIP.has((root.parentElement || ({} as Element)).tagName)) doText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (SKIP.has(el.tagName)) return;
  doAttrs(el);
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === Node.ELEMENT_NODE && SKIP.has((n as Element).tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let n: Node | null = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text);
    else doAttrs(n as Element);
    n = tw.nextNode();
  }
}

function restore(root: Node) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null = tw.currentNode;
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const rec = originalText.get(n as Text);
      if (rec && (n as Text).nodeValue === rec.en) (n as Text).nodeValue = rec.th;
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const recs = originalAttr.get(n as Element);
      if (recs) for (const [a, r] of Object.entries(recs)) if ((n as Element).getAttribute(a) === r.en) (n as Element).setAttribute(a, r.th);
    }
    n = tw.nextNode();
  }
}

/** Starts translating the page; the returned function stops it and restores the Thai text. */
export function startDomTranslation(): () => void {
  walk(document.body);
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach((n) => walk(n));
      else if (r.type === 'characterData') {
        if (r.target.parentElement && !SKIP.has(r.target.parentElement.tagName)) doText(r.target as Text);
      } else if (r.type === 'attributes') doAttrs(r.target as Element);
    }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  return () => {
    obs.disconnect();
    restore(document.body);
  };
}
