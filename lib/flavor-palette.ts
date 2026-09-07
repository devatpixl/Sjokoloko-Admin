/**
 * Mirror of the storefront's flavour palette (storefront/lib/flavors.ts).
 *
 * The dot beside each smaksnote is not stored anywhere: the storefront works
 * it out from the words in the line, longest key first, and falls back to a
 * muted grey when nothing matches. The admin keeps a copy so the editor can
 * show the real colour a line will get, and warn when a line will come out
 * grey on the live page.
 *
 * Keep in step with storefront/lib/flavors.ts. If a flavour is added there,
 * add it here too or the preview will under-report the colour.
 */

export interface FlavorMeta {
  color: string
  note?: string
}

export const FLAVOR_PALETTE: Record<string, FlavorMeta> = {
  pistasj: { color: '#8A9A5B', note: 'Myk og nøtteaktig med en lett sødme' },
  hasselnøtt: { color: '#8B6914', note: 'Rik og karamellisert, klassisk sjokoladepar' },
  karamell: { color: '#C9A35B', note: 'Smøraktig og dyp med et hint av salt' },
  pasjonsfrukt: { color: '#E8763A', note: 'Intens og blomsteraktig med naturlig syre' },
  'hvit vanilje': { color: '#F3E5AB', note: 'Mild og kremet, ren vaniljesmak' },
  'mango chili': { color: '#F5A623', note: 'Tropisk mango med et hint av chili' },
  vanilje: { color: '#E8D4A8', note: 'Madagascar, krem' },
  bringebær: { color: '#8E2837', note: 'Skarp, rød' },
  'hot mango': { color: '#C0602E', note: 'Chili, tørket' },
  mango: { color: '#F5A623', note: 'Tropisk, sødme' },
  lakris: { color: '#2B1810', note: 'Fransk, jordnær' },
  vaniljesjokolade: { color: '#E8D4A8', note: 'Mild, skummet' },
  'vanilje & hasselnøtt': { color: '#C9A574', note: 'Mild krem, nøtter' },
  kunaifa: { color: '#D89A3E', note: 'Ristet, sprø' },
  melkesjokolade: { color: '#8B5A2B', note: 'Belgisk, balansert' },
  oreo: { color: '#1A110C', note: 'Kjeks, skummet melk' },
}

export const FALLBACK_COLOR = '#9E8868'

const KEYS_LONGEST_FIRST = Object.keys(FLAVOR_PALETTE).sort((a, b) => b.length - a.length)

/** Resolve a line the same way the storefront does: exact key, then substring. */
export function getFlavorMeta(line: string): FlavorMeta & { matched: string | null } {
  if (!line) return { color: FALLBACK_COLOR, matched: null }
  const key = line.trim().toLowerCase()
  if (FLAVOR_PALETTE[key]) return { ...FLAVOR_PALETTE[key], matched: key }
  for (const k of KEYS_LONGEST_FIRST) {
    if (key.includes(k)) return { ...FLAVOR_PALETTE[k], matched: k }
  }
  return { color: FALLBACK_COLOR, matched: null }
}

/** The flavour words that win a colour, for the hint under the editor. */
export const KNOWN_FLAVORS = KEYS_LONGEST_FIRST.slice().sort()
