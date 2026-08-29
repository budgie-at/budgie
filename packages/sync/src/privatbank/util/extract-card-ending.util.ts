import { PRIVATBANK_CARD_LAST_DIGITS_LENGTH } from '../constant/privatbank.constant';

export const extractCardEnding = (maskedCard: string): string => maskedCard.slice(-PRIVATBANK_CARD_LAST_DIGITS_LENGTH);
