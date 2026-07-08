import { Log } from '@budgie/logger';
import { getUnixTime } from 'date-fns';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { generateStableExternalIdHash } from '../../core/util/generate-stable-external-id-hash.util';
import { ERSTE_CURRENCY_CODE_EUR, ERSTE_EXTERNAL_ID_LENGTH } from '../constant/erste.constant';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

class ErsteMapper {
    @Log(
        account => `enter iban=${account.iban} newBalance=${account.newBalance}`,
        (result, account) => `done iban=${account.iban} accountId=${result.id}`,
        (error, account) => `throw iban=${account.iban} error=${getErrorMessage(error)}`
    )
    mapAccount(account: ErsteAccountInfoInterface): BankAccountInterface {
        return {
            id: account.iban,
            provider: BankProviderEnum.ERSTE,
            currencyCode: account.currency,
            currencyCodeNumeric: ERSTE_CURRENCY_CODE_EUR,
            balance: account.newBalance,
            creditLimit: 0,
            type: BankAccountTypeEnum.CHECKING,
            iban: account.iban
        };
    }

    @Log(
        (row, iban) => `enter iban=${iban} date=${row.date.toISOString()} amount=${row.amount} reference="${row.reference}"`,
        (result, row, iban) => `done iban=${iban} date=${row.date.toISOString()} externalId=${result.id}`,
        (error, row, iban) => `throw iban=${iban} date=${row.date.toISOString()} amount=${row.amount} error=${getErrorMessage(error)}`
    )
    mapTransaction(row: ErsteRowInterface, iban: string): BankTransactionInterface {
        const id = this.generateExternalId(row, iban);
        const legacyExternalIds = this.generateLegacyExternalIds(row, iban, id);

        return {
            id,
            ...(isNotEmptyArray(legacyExternalIds) && { legacyExternalIds }),
            provider: BankProviderEnum.ERSTE,
            accountId: iban,
            type: row.isCredit ? BankTransactionTypeEnum.INCOME : BankTransactionTypeEnum.EXPENSE,
            time: getUnixTime(row.date),
            description: row.description,
            comment: this.buildComment(row),
            mcc: 0,
            originalMcc: 0,
            amount: Math.abs(row.amount),
            operationAmount: Math.abs(row.amount),
            currencyCode: ERSTE_CURRENCY_CODE_EUR,
            commissionRate: 0,
            cashbackAmount: 0,
            balance: 0,
            hold: false,
            category: '',
            feeAmount: 0
        };
    }

    private buildComment(row: ErsteRowInterface): string {
        if (!isNotEmptyString(row.city)) {
            return '';
        }

        if (isNotEmptyString(row.countryAlpha2)) {
            return `${row.city}, ${row.countryAlpha2}`;
        }

        return row.city;
    }

    private generateExternalId(row: ErsteRowInterface, iban: string): string {
        const seed = [this.buildStatementDateKey(row.date), iban, row.amount, String(row.isCredit), row.reference, row.description].join(
            '|'
        );

        return generateStableExternalIdHash(seed).slice(0, ERSTE_EXTERNAL_ID_LENGTH);
    }

    private generateLegacyExternalIds(row: ErsteRowInterface, iban: string, id: string): string[] {
        return [
            ...new Set([
                this.generateLocationLegacyExternalId(row, iban),
                this.generateInstantReferenceDetailsLegacyExternalId(row, iban),
                this.generateInstantDescriptionLegacyExternalId(row, iban)
            ])
        ].filter(legacyExternalId => legacyExternalId !== id);
    }

    private generateLocationLegacyExternalId(row: ErsteRowInterface, iban: string): string {
        const seed = [
            this.buildStatementDateKey(row.date),
            iban,
            row.amount,
            row.reference,
            row.description,
            row.details,
            row.city ?? '',
            row.countryAlpha2 ?? ''
        ].join('|');

        return generateStableExternalIdHash(seed).slice(0, ERSTE_EXTERNAL_ID_LENGTH);
    }

    private generateInstantReferenceDetailsLegacyExternalId(row: ErsteRowInterface, iban: string): string {
        const seed = `${row.date.toISOString()}|${iban}|${row.amount}|${row.reference}|${row.details}`;

        return generateStableExternalIdHash(seed).slice(0, ERSTE_EXTERNAL_ID_LENGTH);
    }

    private generateInstantDescriptionLegacyExternalId(row: ErsteRowInterface, iban: string): string {
        const seed = `${row.date.toISOString()}|${iban}|${row.amount}|${row.description}`;

        return generateStableExternalIdHash(seed).slice(0, ERSTE_EXTERNAL_ID_LENGTH);
    }

    private buildStatementDateKey(date: Date): string {
        const year = String(date.getFullYear()).padStart(4, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}

export const ersteMapper = new ErsteMapper();
