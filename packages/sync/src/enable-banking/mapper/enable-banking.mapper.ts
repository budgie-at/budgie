import { convertFromMicroUnits, convertToMicroUnits, normalizeAccountIban } from '@budgie/contracts';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { CURRENCY_CODE_BY_NUMERIC_CODE } from '../../core/constant/currency-code-by-numeric-code.constant';
import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { generateStableExternalIdHash } from '../../core/utils/generate-stable-external-id-hash.util';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBalanceSnapshotInterface } from '../../core/interface/sync-balance-snapshot.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { EnableBankingAccountApiInterface } from '../interface/enable-banking-account-api.schema';
import type { EnableBankingBalanceApiInterface } from '../interface/enable-banking-balance-api.schema';
import type { EnableBankingDatedRowInterface } from '../interface/enable-banking-dated-row.interface';
import type { EnableBankingTransactionApiInterface } from '../interface/enable-banking-transaction-api.schema';

class EnableBankingMapper {
    private static readonly BOOKED_STATUS = 'BOOK';
    private static readonly CREDIT_INDICATOR = 'CRDT';
    private static readonly DEBIT_INDICATOR = 'DBIT';
    private static readonly BOOKED_BALANCE_TYPES = ['ITBD', 'CLBD'] as const;
    private static readonly AMOUNT_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/u;
    private static readonly DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
    private static readonly MILLISECONDS_PER_SECOND = 1000;
    private static readonly MCC_PATTERN = /^\d+$/u;
    private static readonly CARD_PAYMENT_PATTERN = /^POS\s+\d[\d.,]*\s+[A-Z]{2}\s+K\d\s+\d{2}[./-]\d{2}[./-]\d{2,4}\s+(\S.*)$/u;
    private static readonly NUMERIC_CODE_BY_CURRENCY = new Map(
        Object.entries(CURRENCY_CODE_BY_NUMERIC_CODE).map(([numericCode, currencyCode]) => [currencyCode, Number(numericCode)])
    );

    private static readonly ACCOUNT_TYPE_BY_CASH_ACCOUNT_TYPE = new Map([
        ['CACC', SyncAccountTypeEnum.CHECKING],
        ['CARD', SyncAccountTypeEnum.CARD],
        ['SVGS', SyncAccountTypeEnum.SAVINGS]
    ]);

    mapAccount(aspspName: string, account: EnableBankingAccountApiInterface): SyncAccountInterface {
        const iban = normalizeAccountIban(account.account_id?.iban);
        const accountLabel = [account.name, account.product, account.currency].find(isNotEmptyString);

        return {
            id: account.identification_hash,
            provider: SyncProviderEnum.ENABLE_BANKING,
            currencyCode: account.currency,
            currencyCodeNumeric: this.resolveNumericCurrencyCode(account.currency),
            balance: 0,
            balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
            creditLimit: 0,
            type: EnableBankingMapper.ACCOUNT_TYPE_BY_CASH_ACCOUNT_TYPE.get(account.cash_account_type) ?? SyncAccountTypeEnum.UNKNOWN,
            title: `${aspspName} ${accountLabel ?? ''}`.trim(),
            ...(isNotEmptyString(iban) && { iban })
        };
    }

    mapTransactions(
        identificationHash: string,
        currencyCode: string,
        transactions: readonly EnableBankingTransactionApiInterface[]
    ): SyncTransactionInterface[] | null {
        const rows = transactions
            .filter(transaction => transaction.status === EnableBankingMapper.BOOKED_STATUS)
            .map(transaction => this.buildRow(transaction));
        const datedRows = rows.filter(isDefined);
        if (datedRows.length !== rows.length || this.hasReferenceAcrossDates(datedRows)) {
            return null;
        }

        const mapped = this.mapRowsWithExternalIds(identificationHash, currencyCode, datedRows);
        const stored = mapped.filter(isDefined);

        return stored.length === mapped.length ? stored.filter(transaction => isPositiveNumber(transaction.amount)) : null;
    }

    resolveBalanceSnapshot(
        balances: readonly EnableBankingBalanceApiInterface[],
        currencyCode: string,
        fetchStartedAt: Date
    ): SyncBalanceSnapshotInterface | null {
        const [balance] = EnableBankingMapper.BOOKED_BALANCE_TYPES.flatMap(balanceType =>
            balances.filter(item => item.balance_type === balanceType && item.balance_amount.currency === currencyCode)
        );
        const amount = isDefined(balance) ? this.parseMicroUnits(balance.balance_amount.amount) : null;
        if (!isDefined(balance) || !isDefined(amount)) {
            return null;
        }

        const changedAtMs = isNotEmptyString(balance.last_change_date_time) ? Date.parse(balance.last_change_date_time) : Number.NaN;
        const referenceEndMs = isNotEmptyString(balance.reference_date)
            ? Date.parse(`${balance.reference_date}T23:59:59.000Z`)
            : Number.NaN;
        const candidateMs = [changedAtMs, referenceEndMs].find(Number.isFinite) ?? fetchStartedAt.getTime();
        const atMs = Math.min(fetchStartedAt.getTime(), candidateMs);

        return {
            at: new Date(Math.floor(atMs / EnableBankingMapper.MILLISECONDS_PER_SECOND) * EnableBankingMapper.MILLISECONDS_PER_SECOND),
            balance: amount
        };
    }

    private buildRow(transaction: EnableBankingTransactionApiInterface): EnableBankingDatedRowInterface | null {
        const bookedOn = transaction.booking_date ?? transaction.value_date;
        if (!isNotEmptyString(bookedOn) || !EnableBankingMapper.DATE_PATTERN.test(bookedOn)) {
            return null;
        }

        return { transaction, bookedOn, contentHash: generateStableExternalIdHash(this.buildContentKey(transaction)) };
    }

    private hasReferenceAcrossDates(rows: readonly EnableBankingDatedRowInterface[]): boolean {
        const dayByReference = new Map<string, string>();

        return rows.some(({ transaction, bookedOn }) => {
            const reference = transaction.entry_reference;
            if (!isNotEmptyString(reference)) {
                return false;
            }

            const knownDay = dayByReference.get(reference);
            dayByReference.set(reference, bookedOn);

            return isDefined(knownDay) && knownDay !== bookedOn;
        });
    }

    private mapRowsWithExternalIds(identificationHash: string, currencyCode: string, rows: readonly EnableBankingDatedRowInterface[]) {
        const occurrenceByKey = new Map<string, number>();

        return [...rows]
            .sort((left, right) => left.contentHash.localeCompare(right.contentHash))
            .map(row => {
                const reference = row.transaction.entry_reference;
                const key = isNotEmptyString(reference) ? `reference:${reference}` : `content:${row.contentHash}`;
                const occurrence = occurrenceByKey.get(key) ?? 0;
                occurrenceByKey.set(key, occurrence + 1);
                const externalId = isNotEmptyString(reference)
                    ? `${identificationHash}:${reference}${isPositiveNumber(occurrence) ? `:${occurrence}` : ''}`
                    : `${identificationHash}:${generateStableExternalIdHash(`${row.contentHash}|${occurrence}`)}`;

                return this.mapTransaction(identificationHash, currencyCode, row, externalId);
            });
    }

    private resolveValidAmount(transaction: EnableBankingTransactionApiInterface, currencyCode: string): number | null {
        const indicator = transaction.credit_debit_indicator;
        const signedAmount = this.parseMicroUnits(transaction.transaction_amount.amount);
        const isKnownIndicator = indicator === EnableBankingMapper.CREDIT_INDICATOR || indicator === EnableBankingMapper.DEBIT_INDICATOR;
        const isSignConsistent = indicator !== EnableBankingMapper.CREDIT_INDICATOR || (signedAmount ?? 0) >= 0;

        return isKnownIndicator && isSignConsistent && transaction.transaction_amount.currency === currencyCode && isDefined(signedAmount)
            ? Math.abs(signedAmount)
            : null;
    }

    private mapCounterparty(transaction: EnableBankingTransactionApiInterface, isIncome: boolean) {
        const name = (isIncome ? transaction.debtor : transaction.creditor)?.name;
        const iban = (isIncome ? transaction.debtor_account : transaction.creditor_account)?.iban;
        const remittance = (transaction.remittance_information ?? []).join(' ').trim();

        return {
            description: [name, this.extractCardMerchant(remittance), remittance].find(isNotEmptyString) ?? 'Bank transaction',
            ...(isNotEmptyString(iban) && { counterIban: iban }),
            ...(isNotEmptyString(name) && { counterName: name }),
            ...(isNotEmptyString(remittance) && { comment: remittance })
        };
    }

    private extractCardMerchant(remittance: string): string | null {
        const merchant = EnableBankingMapper.CARD_PAYMENT_PATTERN.exec(remittance)?.[1]?.replaceAll(/\s+/gu, ' ').trim();

        return isNotEmptyString(merchant) ? merchant : null;
    }

    private mapTransaction(
        identificationHash: string,
        currencyCode: string,
        { transaction, bookedOn }: EnableBankingDatedRowInterface,
        externalId: string
    ): SyncTransactionInterface | null {
        const microUnits = this.resolveValidAmount(transaction, currencyCode);
        const operatedAtMs = Date.parse(`${bookedOn}T00:00:00.000Z`);
        if (!isDefined(microUnits) || !Number.isFinite(operatedAtMs)) {
            return null;
        }

        const isIncome = transaction.credit_debit_indicator === EnableBankingMapper.CREDIT_INDICATOR;
        const amount = convertFromMicroUnits(microUnits);
        const merchantCategoryCode = transaction.merchant_category_code ?? '';
        const mcc = EnableBankingMapper.MCC_PATTERN.test(merchantCategoryCode) ? Number(merchantCategoryCode) : 0;

        return {
            id: externalId,
            provider: SyncProviderEnum.ENABLE_BANKING,
            accountId: identificationHash,
            type: isIncome ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
            time: operatedAtMs / EnableBankingMapper.MILLISECONDS_PER_SECOND,
            mcc,
            originalMcc: mcc,
            amount,
            operationAmount: amount,
            currencyCode: this.resolveNumericCurrencyCode(currencyCode),
            commissionRate: 0,
            cashbackAmount: 0,
            balance: 0,
            hold: false,
            feeAmount: 0,
            ...this.mapCounterparty(transaction, isIncome)
        };
    }

    private buildContentKey(transaction: EnableBankingTransactionApiInterface): string {
        return JSON.stringify([
            transaction.booking_date ?? transaction.value_date ?? '',
            transaction.transaction_amount.amount,
            transaction.credit_debit_indicator,
            transaction.creditor?.name ?? '',
            transaction.debtor?.name ?? '',
            transaction.remittance_information ?? []
        ]);
    }

    private parseMicroUnits(value: string): number | null {
        const match = EnableBankingMapper.AMOUNT_PATTERN.exec(value);
        if (!isDefined(match)) {
            return null;
        }

        const [, sign, integerDigits = '0', fractionDigits = '0'] = match;
        const microUnits = convertToMicroUnits(Number(integerDigits)) + convertToMicroUnits(Number(`0.${fractionDigits}`));
        if (!Number.isSafeInteger(microUnits)) {
            return null;
        }

        return sign === '-' ? -microUnits : microUnits;
    }

    private resolveNumericCurrencyCode(currencyCode: string): number {
        return EnableBankingMapper.NUMERIC_CODE_BY_CURRENCY.get(currencyCode) ?? 0;
    }
}

export const enableBankingMapper = new EnableBankingMapper();
