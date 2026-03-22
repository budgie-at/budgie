export const generateLocalId = (): string => `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
