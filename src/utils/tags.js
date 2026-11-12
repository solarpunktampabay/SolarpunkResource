// Smart tag grouping, with plain text rules only (no AI).
//
// People type tags by hand, so the sheet has "USF Specific", "USF" and "usf", or
// "Gardens", "gardens" and "community gardening". Treating each spelling as a separate
// tag splits the results. Here every tag is reduced to a canonical key, and tags that
// share a key are one group: picking any of them matches listings that have any of them.
//
// A key is built from, in order:
//   1. lower-casing and stripping punctuation / extra spaces
//   2. PHRASE_ALIASES  (hand-written synonyms, e.g. "usf specific" -> "usf")
//   3. light stemming  (plurals and -ing: "gardens", "gardening" -> "garden")
//   4. joining without spaces ("health care" and "healthcare" match)
//   5. typo merging: keys one edit apart (swap/add/drop/replace a letter) are merged
//      into the more common spelling, e.g. "wildlife" / "wildlfie"
//
// To teach it a new synonym, add a line to PHRASE_ALIASES below.

// Hand-written synonyms. Both sides are written in the normalised form (lower case, no
// punctuation). The value is the phrase the tag should be treated as.
const PHRASE_ALIASES = {
  'usf specific': 'usf',
  'university of south florida': 'usf',
  'go bulls': 'usf',
  environmental: 'environment',
  sustainable: 'sustainability',
  'sustainable living': 'sustainability',
  'volunteer opportunities': 'volunteering',
  'job opportunity': 'jobs',
  employment: 'jobs',
  'community involvement': 'community engagement',
  'civic engagement': 'community engagement',
  climate: 'climate change',
  recycled: 'recycling',
  trash: 'waste',
  garbage: 'waste',
};

const normalise = (tag) =>
  String(tag || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Very light stemmer: just enough to line up plurals and "-ing" forms.
const stemWord = (word) => {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
};

// Canonical key for one tag (before typo merging). Empty string means "ignore this tag".
export const tagKey = (tag) => {
  const phrase = normalise(tag);
  if (!phrase) return '';
  const aliased = PHRASE_ALIASES[phrase] || phrase;
  return aliased.split(' ').map(stemWord).join('');
};

// True when a and b differ by at most one edit (insert, delete, replace, or swapping two
// neighbouring letters). Used to merge typos.
const withinOneEdit = (a, b) => {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i += 1;
  if (la === lb) {
    // one replacement, or one adjacent swap
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
};

const MIN_TYPO_LENGTH = 7; // short words are too easy to confuse ("plan" vs "plant")

// Builds the tag index for a list of activities.
// Returns:
//   groups:        [{ key, label, variants[], count }] most-used first
//   keysByActivity: Map(activity.id -> Set of group keys the activity belongs to)
export const buildTagIndex = (activities) => {
  // 1. raw key per tag, and how many listings use each raw key
  const rawCounts = new Map();
  const perActivityRaw = new Map();
  activities.forEach((activity) => {
    const raws = new Set();
    (activity.tags || []).forEach((tag) => {
      const k = tagKey(tag);
      if (k) raws.add(k);
    });
    perActivityRaw.set(activity.id, raws);
    raws.forEach((k) => rawCounts.set(k, (rawCounts.get(k) || 0) + 1));
  });

  // 2. merge near-duplicate (typo) keys into the more common spelling
  const canonical = new Map(); // raw key -> canonical key
  const representatives = [];
  [...rawCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([key]) => {
      const match =
        key.length >= MIN_TYPO_LENGTH
          ? representatives.find((r) => r.length >= MIN_TYPO_LENGTH && withinOneEdit(r, key))
          : null;
      if (match) {
        canonical.set(key, match);
      } else {
        canonical.set(key, key);
        representatives.push(key);
      }
    });

  // 3. build groups: every spelling that landed on a key, plus how many listings match
  const groupMap = new Map(); // key -> { variants: Map(label -> uses), activityIds: Set }
  const keysByActivity = new Map();
  activities.forEach((activity) => {
    const keys = new Set();
    (activity.tags || []).forEach((tag) => {
      const raw = tagKey(tag);
      if (!raw) return;
      const key = canonical.get(raw);
      keys.add(key);
      const label = String(tag).trim();
      if (!groupMap.has(key)) groupMap.set(key, { variants: new Map(), activityIds: new Set() });
      const group = groupMap.get(key);
      group.variants.set(label, (group.variants.get(label) || 0) + 1);
      group.activityIds.add(activity.id);
    });
    keysByActivity.set(activity.id, keys);
  });

  const groups = [...groupMap.entries()]
    .map(([key, { variants, activityIds }]) => {
      // Display the spelling people use most; on a tie prefer the shorter, tidier one.
      const ordered = [...variants.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0])
      );
      return {
        key,
        label: ordered[0][0],
        variants: ordered.map(([label]) => label),
        count: activityIds.size,
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  return { groups, keysByActivity };
};
