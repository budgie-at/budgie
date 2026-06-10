import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { PRIVATBANK_FAKE_IBAN_PREFIX } from '../constant/privatbank.constant';
import { extractCardEnding } from '../util/extract-card-ending.util';

import { privatbankCurrencyCodeMapper } from './privatbank-currency-code.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const mapCardToAccount = (card: string, currencyString: string): SyncAccountInterface => ({
    id: card,
    provider: SyncProviderEnum.PRIVATBANK,
    currencyCode: currencyString,
    currencyCodeNumeric: privatbankCurrencyCodeMapper(currencyString),
    balance: 0,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD,
    iban: `${PRIVATBANK_FAKE_IBAN_PREFIX}${extractCardEnding(card)}`,
    maskedPan: [card]
});

export const privatbankAccountMapper = (rows: PrivatbankRowInterface[]): SyncAccountInterface[] => {
    const uniqueCards = new Map<string, string>();

    for (const row of rows) {
        if (!uniqueCards.has(row.card)) {
            uniqueCards.set(row.card, row.cardCurrency);
        }
    }

    return [...uniqueCards.entries()].map(([card, currency]) => mapCardToAccount(card, currency));
};
