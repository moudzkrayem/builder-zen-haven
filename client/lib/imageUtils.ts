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
