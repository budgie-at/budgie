import { isDefined } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankSyncErrorCodeEnum } from '../../core/enum/bank-sync-error-code.enum';
import { BankSyncError } from '../../core/error/bank-sync.error';
import { ERSTE_ACCOUNT_NUMBER_REGEX, ERSTE_IBAN_REGEX } from '../constant/erste.constant';
import { parseErsteStatementDate } from '../util/parse-erste-statement-date.util';

import type { ErsteTextParserInterface } from './erste-text-parser.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';

export abstract class ErsteBaseTextParser implements ErsteTextParserInterface {
    protected extractIban(text: string): string {
        const match = text.match(ERSTE_IBAN_REGEX);

        if (!isDefined(match)) {
            throw this.createParseError('Could not find IBAN in Erste PDF');
        }

        return match[0];
    }

    protected extractAccountNumber(text: string): string {
        const match = text.match(ERSTE_ACCOUNT_NUMBER_REGEX);

        return match?.[1] ?? '';
    }

    protected extractStatementDate(text: string): Date {
        const date = parseErsteStatementDate(text);

        if (!isDefined(date)) {
            throw this.createParseError('Could not find statement date in Erste PDF');
        }

        return date;
    }

    protected extractAccountInfo(text: string, oldBalanceKeyword: string, newBalanceKeywords: string[]): ErsteAccountInfoInterface {
        const iban = this.extractIban(text);
        const accountNumber = this.extractAccountNumber(text);
        const statementDate = this.extractStatementDate(text);
        const oldBalance = this.extractBalance(text, oldBalanceKeyword);
        const newBalance = this.resolveBalance(text, newBalanceKeywords);

        return { iban, accountNumber, currency: 'EUR', oldBalance, newBalance, statementDate };
    }

    protected createParseError(message: string, originalError?: unknown): BankSyncError {
        return new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, message, BankProviderEnum.ERSTE, originalError);
    }

    private resolveBalance(text: string, keywords: string[]): number {
        for (const keyword of keywords) {
            const balance = this.extractBalance(text, keyword);

            if (balance !== 0) {
                return balance;
            }
        }

        return 0;
    }

    abstract parse(text: string): ErsteParsedDataInterface;

    protected abstract extractBalance(text: string, keyword: string): number;
}
