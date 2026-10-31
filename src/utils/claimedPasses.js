const STORAGE_KEY = 'visitexpo_claimed_passes';

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export function getEventPassKeys(event) {
  const record = event?.event && typeof event.event === 'object' ? event.event : event;
  return [
    record?._id,
    record?.id,
    record?.eventId,
    record?.wpPostId,
    record?.slug
  ]
    .map(normalize)
    .filter(Boolean);
}

export function readClaimedPasses() {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.map(normalize).filter(Boolean) : []);
  } catch (error) {
    console.warn('Could not read claimed visitor passes:', error);
    return new Set();
  }
}

export function hasClaimedPass(event, claimedPasses) {
  const claimed = claimedPasses instanceof Set
    ? new Set(Array.from(claimedPasses, normalize))
    : readClaimedPasses();
  return getEventPassKeys(event).some((key) => claimed.has(key));
}

export function rememberClaimedPass(event, pass) {
  if (typeof window === 'undefined') return new Set();
  const next = readClaimedPasses();
  getEventPassKeys(event).forEach((key) => next.add(key));
  getEventPassKeys(pass).forEach((key) => next.add(key));

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    window.dispatchEvent(new Event('visitexpo:pass-claimed'));
  } catch (error) {
    console.error('Could not save claimed visitor pass state:', error);
  }

  return next;
}

export function syncClaimedPassesFromServer(passes) {
  if (typeof window === 'undefined' || !Array.isArray(passes)) return readClaimedPasses();
  const next = readClaimedPasses();
  passes.forEach((pass) => getEventPassKeys(pass).forEach((key) => next.add(key)));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  } catch (error) {
    console.error('Could not sync claimed visitor passes:', error);
  }
  return next;
}
