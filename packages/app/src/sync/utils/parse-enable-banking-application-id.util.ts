const APPLICATION_ID_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\.pem)?$/iu;

export const parseEnableBankingApplicationId = (text: string): string | null => APPLICATION_ID_PATTERN.exec(text.trim())?.[1] ?? null;
