export const getShare = (amount: number, total: number): number => (total > 0 ? amount / total : 0);
