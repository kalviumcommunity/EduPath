// Canonical country mapping & normalization
export const LOCATION_ALIASES = {
  'uk': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'gb': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'usa': 'United States',
  'us': 'United States',
  'u.s.': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  'australia': 'Australia',
  'canada': 'Canada',
  'germany': 'Germany',
  'india': 'India',
  'anywhere': '__ANY__',
  'global': '__ANY__'
};

export function normalizeLocations(rawLocations = []) {
  const out = [];
  for (const loc of rawLocations) {
    if (!loc) continue;
    const key = loc.toString().trim().toLowerCase();
    const mapped = LOCATION_ALIASES[key];
    if (mapped === '__ANY__') {
      // signal no preference -> return empty array to skip location filter
      return [];
    }
    out.push(mapped || capitalizeWords(loc));
  }
  // dedupe & keep order of first occurrence
  return [...new Set(out)];
}

function capitalizeWords(str) {
  return str.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
