import { getUnixTime } from 'date-fns/getUnixTime';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { generateStableExternalIdHash } from '../../core/util/generate-stable-external-id-hash.util';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

const EXTERNAL_ID_LENGTH = 32;
const CURRENCY_CODE_EUR = 978;
const ATM_WITHDRAWAL_MCC = 6011;
const ATM_WITHDRAWAL_DESCRIPTION_REGEX = /^AUTOMAT\s+\d+\s+K\d+\s/u;
const LEGACY_DETAILS = '';

const hashExternalId = (seed: string): string => generateStableExternalIdHash(seed).slice(0, EXTERNAL_ID_LENGTH);

const buildStatementDateKey = (date: Date): string => {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const buildComment = (row: ErsteRowInterface): string => {
    if (!isNotEmptyString(row.city)) {
        return '';
    }

    return isNotEmptyString(row.countryAlpha2) ? `${row.city}, ${row.countryAlpha2}` : row.city;
};

const generateLegacyExternalIds = (row: ErsteRowInterface, iban: string, id: string): string[] => {
    const instant = row.date.toISOString();
    const locationSeed = [
        buildStatementDateKey(row.date),
        iban,
        row.amount,
        row.reference,
        row.description,
        LEGACY_DETAILS,
        row.city ?? '',
        row.countryAlpha2 ?? ''
    ].join('|');

    return [
        ...new Set([
            hashExternalId(locationSeed),
            hashExternalId(`${instant}|${iban}|${row.amount}|${row.reference}|${LEGACY_DETAILS}`),
            hashExternalId(`${instant}|${iban}|${row.amount}|${row.description}`)
        ])
    ].filter(legacyExternalId => legacyExternalId !== id);
};

export const mapErsteAccount = (account: ErsteAccountInfoInterface): SyncAccountInterface => ({
    id: account.iban,
    provider: SyncProviderEnum.ERSTE,
    currencyCode: 'EUR',
    currencyCodeNumeric: CURRENCY_CODE_EUR,
    balance: account.newBalance,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CHECKING,
    iban: account.iban
});

export const mapErsteTransaction = (row: ErsteRowInterface, iban: string): SyncTransactionInterface => {
    const id = hashExternalId(
        [buildStatementDateKey(row.date), iban, row.amount, String(row.isCredit), row.reference, row.description].join('|')
    );
    const legacyExternalIds = generateLegacyExternalIds(row, iban, id);

    return {
        id,
        ...(isNotEmptyArray(legacyExternalIds) && { legacyExternalIds }),
        provider: SyncProviderEnum.ERSTE,
        accountId: iban,
        type: row.isCredit ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
        time: getUnixTime(row.date),
        description: row.description,
        comment: buildComment(row),
        mcc: !row.isCredit && ATM_WITHDRAWAL_DESCRIPTION_REGEX.test(row.description) ? ATM_WITHDRAWAL_MCC : 0,
        originalMcc: 0,
        amount: Math.abs(row.amount),
        operationAmount: Math.abs(row.amount),
        currencyCode: CURRENCY_CODE_EUR,
        commissionRate: 0,
        cashbackAmount: 0,
        balance: 0,
        hold: false,
        category: '',
        feeAmount: 0
    };
};
