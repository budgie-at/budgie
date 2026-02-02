import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { PRIVATBANK_FAKE_IBAN_PREFIX } from '../constant/privatbank.constant';
import { extractCardEnding } from '../util/extract-card-ending.util';

import { privatbankCurrencyCodeMapper } from './privatbank-currency-code.mapper';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const mapCardToAccount = (card: string, currencyString: string): BankAccountInterface => ({
    id: card,
    provider: BankProviderEnum.PRIVATBANK,
    currencyCode: currencyString,
    currencyCodeNumeric: privatbankCurrencyCodeMapper(currencyString),
    balance: 0,
    creditLimit: 0,
    type: BankAccountTypeEnum.CARD,
    iban: `${PRIVATBANK_FAKE_IBAN_PREFIX}${extractCardEnding(card)}`,
    maskedPan: [card]
});

export const privatbankAccountMapper = (rows: PrivatbankRowInterface[]): BankAccountInterface[] => {
    const uniqueCards = new Map<string, string>();

    for (const row of rows) {
        if (!uniqueCards.has(row.card)) {
            uniqueCards.set(row.card, row.cardCurrency);
        }
    }

    return [...uniqueCards.entries()].map(([card, currency]) => mapCardToAccount(card, currency));
};
