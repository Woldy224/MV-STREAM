const MY_LIST_KEY = 'mv_my_list';
const LIKES_KEY = 'mv_likes';

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
}

function toggleId(key: string, id: string) {
  const current = new Set(readIds(key));
  if (current.has(id)) {
    current.delete(id);
    writeIds(key, Array.from(current));
    return false;
  }
  current.add(id);
  writeIds(key, Array.from(current));
  return true;
}

export function isInMyList(id: string): boolean {
  return readIds(MY_LIST_KEY).includes(String(id));
}

export function toggleMyList(id: string): boolean {
  return toggleId(MY_LIST_KEY, String(id));
}

export function isLiked(id: string): boolean {
  return readIds(LIKES_KEY).includes(String(id));
}

export function toggleLiked(id: string): boolean {
  return toggleId(LIKES_KEY, String(id));
}

export async function shareContentLink(url: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, url });
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
    return 'failed';
  } catch {
    return 'failed';
  }
}
