const CARD_LAST_DIGITS_LENGTH = 4;

export const extractCardEnding = (maskedCard: string): string => maskedCard.slice(-CARD_LAST_DIGITS_LENGTH);
