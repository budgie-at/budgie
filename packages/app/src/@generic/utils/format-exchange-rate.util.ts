const MAX_RATE_DECIMALS = 6;

export const formatExchangeRate = (rate: number): string => Number(rate.toFixed(MAX_RATE_DECIMALS)).toString();
