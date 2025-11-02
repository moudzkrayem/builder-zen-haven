// Feature flags centralization
// Set VITE_ENABLE_PREMIUM=true in your environment to re-enable premium features
export const PREMIUM_ENABLED = import.meta.env.VITE_ENABLE_PREMIUM === 'true';
