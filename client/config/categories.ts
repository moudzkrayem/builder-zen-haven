// Shared canonical categories for the app
export const CATEGORIES = [
  { id: 'all', label: 'All', color: 'bg-primary' },
  { id: 'culinary', label: 'Food & Drink', color: 'bg-orange-500' },
  { id: 'sports', label: 'Sports & Fitness', color: 'bg-green-500' },
  { id: 'professional', label: 'Professional', color: 'bg-blue-500' },
  { id: 'creative', label: 'Arts & Culture', color: 'bg-purple-500' },
  { id: 'outdoor', label: 'Outdoors', color: 'bg-emerald-500' },
  { id: 'social', label: 'Social', color: 'bg-pink-500' },
  { id: 'tech', label: 'Tech', color: 'bg-sky-500' },
  { id: 'travel', label: 'Travel', color: 'bg-indigo-500' },
  { id: 'education', label: 'Education', color: 'bg-teal-500' },
  { id: 'gaming', label: 'Gaming', color: 'bg-rose-500' },
];

// Helper map for quick lookups
export const CATEGORY_BY_ID = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, { id: string; label: string; color: string }>);
