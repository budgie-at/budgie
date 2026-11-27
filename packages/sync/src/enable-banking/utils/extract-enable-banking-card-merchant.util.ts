import { isNotEmptyString } from '@rnw-community/shared';

const CARD_PAYMENT_PATTERN =
    /^POS\s+\d[\d.,]*\s+[A-Z]{2}\s+K\d\s+\d{2}[./-]\d{2}(?:[./-]\d{2,4}(?:\s+\d{2}:\d{2})?|[./-]\s+\d{2}:\d{2})\s+(\S[\s\S]*)$/u;
const CLOCK_ONLY_PATTERN = /^\d{2}:\d{2}$/u;

export const extractEnableBankingCardMerchant = (remittance: string): string | null => {
    const merchant = CARD_PAYMENT_PATTERN.exec(remittance)?.[1]?.replaceAll(/\s+/gu, ' ').trim();

    return isNotEmptyString(merchant) && !CLOCK_ONLY_PATTERN.test(merchant) ? merchant : null;
};
