export function getImageCandidates(item: any, resolvedMap?: Record<string, string>) {
  if (!item) return [] as string[];

  const candidates: Array<string | undefined | null> = [];

  // If a resolved URL map is provided (e.g., ScheduleModal), prefer it first
  try {
    const id = item.id != null ? String(item.id) : undefined;
    if (id && resolvedMap && resolvedMap[id]) candidates.push(resolvedMap[id]);
  } catch (err) {}

  // Common canonical fields used across the app
  if ((item as any)._resolvedImage) candidates.push((item as any)._resolvedImage);
  if ((item as any).image) candidates.push((item as any).image);
  if ((item as any).eventImages && Array.isArray((item as any).eventImages) && (item as any).eventImages.length > 0) candidates.push((item as any).eventImages[0]);
  if ((item as any).photos && Array.isArray((item as any).photos) && (item as any).photos.length > 0) candidates.push((item as any).photos[0]);

  // Some events may include hostImage or a dedicated thumbnail
  if ((item as any).hostImage) candidates.push((item as any).hostImage);

  // Deduplicate and filter falsy
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }

  return out;
}

export default getImageCandidates;

export function looksLikeDataUrl(candidate?: string) {
  if (!candidate || typeof candidate !== 'string') return false;
  try {
    const s = candidate.trim();
    if (s.toLowerCase().startsWith('data:')) return true;
    // Also detect URL-encoded data: (e.g., data%3Aimage%2Fjpeg...)
    try {
      const dec = decodeURIComponent(s);
      if (dec.toLowerCase().startsWith('data:')) return true;
    } catch (e) {
      // ignore decode errors
    }
  } catch (e) {}
  return false;
}

export function isHttpDataOrRelative(candidate?: string) {
  if (!candidate || typeof candidate !== 'string') return false;
  const s = candidate.trim();
  return s.startsWith('http') || looksLikeDataUrl(s) || s.startsWith('/');
}

export function normalizeStorageRefPath(candidate: string) {
  let refPath = String(candidate);
  // If the candidate is already a gs:// path, normalize to storage path
  if (refPath.startsWith('gs://')) {
    refPath = refPath.replace('gs://', '');
    const parts = refPath.split('/');
    if (parts.length > 1) parts.shift();
    return parts.join('/');
  }
  // If candidate looks like a firebase storage download URL with /o/<encodedPath>?..., extract encodedPath
  const m = refPath.match(/\/o\/(.*?)\?/);
  if (m && m[1]) {
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }
  return refPath;
}

export function isUnsplash(u?: string) {
  if (!u || typeof u !== 'string') return false;
  return /(^https?:\/\/(?:images\.)?unsplash\.com\/)/i.test(u.trim());
}

export function isTrustedExternalImage(u?: string) {
  if (!u || typeof u !== 'string') return false;
  const s = u.trim();
  // data: URLs, local relative paths, and known CDN/storage hosts are trusted
  if (/^data:image\//i.test(s)) return true;
  if (s.startsWith('/')) return true;
  // Allow firebase storage, google profile images, builder.io CDN, and other known origins
  if (/^https?:\/\/(?:firebasestorage\.googleapis\.com|lh3\.googleusercontent\.com|cdn\.builder\.io|res\.cloudinary\.com)\//i.test(s)) return true;
  return false;
}
