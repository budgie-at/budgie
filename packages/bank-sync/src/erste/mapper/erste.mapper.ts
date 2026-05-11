import { Log } from '@budgie/logger';
import { getUnixTime } from 'date-fns';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { ERSTE_CURRENCY_CODE_EUR, ERSTE_EXTERNAL_ID_LENGTH } from '../constant/erste.constant';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

class ErsteMapper {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- FNV-1a 32-bit constants from RFC
    private static readonly FNV_OFFSET_BASIS = 0x811c9dc5;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- FNV-1a 32-bit constants from RFC
    private static readonly FNV_PRIME = 0x01000193;

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
        return {
            id: this.generateExternalId(row, iban),
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
            category: ''
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
        const seed = `${row.date.toISOString()}|${iban}|${row.amount}|${row.reference}|${row.details}`;

        return this.fnv1aHash(seed).slice(0, ERSTE_EXTERNAL_ID_LENGTH);
    }

    /* jscpd:ignore-start */
    /* eslint-disable no-bitwise, no-plusplus, max-statements -- FNV-1a hash requires bitwise operations */
    private fnv1aHash(input: string): string {
        let hash1 = ErsteMapper.FNV_OFFSET_BASIS;
        let hash2 = ErsteMapper.FNV_OFFSET_BASIS;
        let hash3 = ErsteMapper.FNV_OFFSET_BASIS;
        let hash4 = ErsteMapper.FNV_OFFSET_BASIS;

        for (let index = 0; index < input.length; index++) {
            const charCode = input.charCodeAt(index);

            hash1 ^= charCode;
            hash1 = Math.imul(hash1, ErsteMapper.FNV_PRIME);

            hash2 ^= charCode ^ (index & 0xff);
            hash2 = Math.imul(hash2, ErsteMapper.FNV_PRIME);

            hash3 ^= (charCode + index) & 0xff;
            hash3 = Math.imul(hash3, ErsteMapper.FNV_PRIME);

            hash4 ^= charCode ^ ((index * 31) & 0xff);
            hash4 = Math.imul(hash4, ErsteMapper.FNV_PRIME);
        }

        const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
        const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
        const part3 = (hash3 >>> 0).toString(16).padStart(8, '0');
        const part4 = (hash4 >>> 0).toString(16).padStart(8, '0');

        return `${part1}${part2}${part3}${part4}`;
    }
    /* eslint-enable no-bitwise, no-plusplus, max-statements */
    /* jscpd:ignore-end */
}

export const ersteMapper = new ErsteMapper();
