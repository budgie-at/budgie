/* eslint-disable lingui/no-unlocalized-strings */
import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { parse } from 'date-fns';
import Papa, { ParseResult } from 'papaparse';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { instrumentRepository } from '../@generic/drizzle/db/db';
import { accountService } from '../account/service/account.service';
import { categoryService } from '../category/service/category.service';
import { transactionService } from '../transaction/service/transaction.service';

import { ImporterColumnMapInterface } from './interface/importer-column-map.interface';
import { ImporterRowInterface } from './interface/importer-row.interface';

export class Importer {
    private instrumentsMap: Record<string, InstrumentEntityInterface> = {};
    private accountsMap: Record<string, AccountEntityInterface> = {};
    private categoriesMap: Record<string, CategoryEntityInterface> = {};

    constructor(private readonly columnMap: ImporterColumnMapInterface) {}

    // eslint-disable-next-line max-lines-per-function,max-statements
    async process(csvText: string) {
        const instruments = await instrumentRepository.getAll();
        this.instrumentsMap = instruments.reduce<Record<string, InstrumentEntityInterface>>(
            (acc, instrument) => ({ ...acc, [instrument.code]: instrument }),
            {}
        );
        this.accountsMap = {};
        this.categoriesMap = {};

        const accountInputs = new Map<string, AccountCreateEntityInterface>();
        const categoryInputs = new Map<string, CategoryCreateEntityInterface>();

        let errorsCount = 0;

        await this.processRows(csvText, normalizedRow => {
            const toAccountKey = this.getToAccountKey(normalizedRow);
            if (!accountInputs.has(toAccountKey) && isNotEmptyString(normalizedRow.toCurrency)) {
                accountInputs.set(toAccountKey, {
                    title: toAccountKey,
                    type: AccountTypeEnum.BANK,
                    icon: UserIconNameEnum.Home,
                    nature: AccountNatureEnum.LIABILITY,
                    instrumentId: this.instrumentsMap[normalizedRow.toCurrency].id,
                    currentBalance: 0
                });
            }

            const fromAccountKey = this.getFromAccountKey(normalizedRow);
            if (!accountInputs.has(fromAccountKey) && isNotEmptyString(normalizedRow.fromCurrency)) {
                accountInputs.set(fromAccountKey, {
                    title: fromAccountKey,
                    type: AccountTypeEnum.BANK,
                    icon: UserIconNameEnum.Home,
                    nature: AccountNatureEnum.LIABILITY,
                    instrumentId: this.instrumentsMap[normalizedRow.fromCurrency].id,
                    currentBalance: 0
                });
            }

            if (isNotEmptyString(normalizedRow.category)) {
                // TODO: How to map existing default categories? What to do with the icons?
                categoryInputs.set(normalizedRow.category, { title: normalizedRow.category, icon: UserIconNameEnum.Home });
            }
        });

        this.accountsMap = await accountService.bulkCreate([...accountInputs.values()]);
        this.categoriesMap = await categoryService.bulkCreate([...categoryInputs.values()]);

        const transactions: TransactionCreateEntityInterface[] = [];

        await this.processRows(csvText, (normalizedRow, row) => {
            try {
                const { toAccount, fromAccount, category, operatedAt, amount, fromInstrument, toInstrument } = this.parseRow(normalizedRow);

                let type = TransactionTypeEnum.EXPENSE;
                let firstEntryType = TransactionEntryTypeEnum.DEBIT;
                if (isDefined(fromInstrument)) {
                    type = TransactionTypeEnum.TRANSFER;
                    firstEntryType = TransactionEntryTypeEnum.DEBIT;
                } else if (amount > 0) {
                    type = TransactionTypeEnum.INCOME;
                    firstEntryType = TransactionEntryTypeEnum.CREDIT;
                }

                transactions.push({
                    type,
                    operatedAt,
                    amount: type === TransactionTypeEnum.TRANSFER ? Math.abs(amount) : amount,
                    externalId: normalizedRow.externalId,
                    title: '',
                    externalSource: null,
                    comment: normalizedRow.comment,
                    toAccountId: toAccount.id,
                    fromAccountId: isDefined(fromAccount) ? fromAccount.id : null,
                    // TODO: Provide exchange rate?
                    exchangeRate: 0,
                    tagIds: [],
                    entries: [
                        {
                            amount: Math.abs(amount),
                            type: firstEntryType,
                            instrumentId: toInstrument.id,
                            accountId: toAccount.id,
                            categoryId: category.id
                        },
                        ...(isDefined(fromAccount)
                            ? [
                                  {
                                      amount: Math.abs(amount),
                                      type: TransactionEntryTypeEnum.CREDIT,
                                      instrumentId: fromInstrument.id,
                                      accountId: fromAccount.id,
                                      categoryId: category.id
                                  }
                              ]
                            : [])
                    ]
                } satisfies TransactionCreateEntityInterface);
            } catch (error) {
                errorsCount += 1;
                // eslint-disable-next-line no-console
                console.log(`Error processing row: ${getErrorMessage(error)}`, row);
            }
        });

        const createdTransactions = await transactionService.bulkCreate(transactions);

        return [createdTransactions.length, errorsCount] as const;
    }

    private normalizeRow(row: Record<string, string>): Record<keyof ImporterColumnMapInterface, string> {
        return {
            externalId: row[this.columnMap.externalId].trim(),
            toAccount: row[this.columnMap.toAccount].toLowerCase().trim(),
            fromAccount: row[this.columnMap.fromAccount].toLowerCase().trim(),
            category: row[this.columnMap.category].toLowerCase().trim(),
            operatedAt: row[this.columnMap.operatedAt].toLowerCase().trim(),
            comment: row[this.columnMap.comment].trim(),
            amount: row[this.columnMap.amount].trim(),
            fromCurrency: row[this.columnMap.fromCurrency].toUpperCase().trim(),
            toCurrency: row[this.columnMap.toCurrency].toUpperCase().trim()
        } satisfies Record<keyof ImporterColumnMapInterface, string>;
    }

    // eslint-disable-next-line max-statements
    private parseRow(normalizedRow: Record<keyof ImporterColumnMapInterface, string>): ImporterRowInterface {
        const toAccount = this.accountsMap[this.getToAccountKey(normalizedRow)];
        const fromAccount = this.accountsMap[this.getFromAccountKey(normalizedRow)];
        const category = this.categoriesMap[normalizedRow.category];
        const operatedAt = parse(normalizedRow.operatedAt, 'MM/dd/yyyy HH:mm:ss', new Date());
        const amount = parseFloat(normalizedRow.amount);
        const fromInstrument = this.instrumentsMap[normalizedRow.fromCurrency];
        const toInstrument = this.instrumentsMap[normalizedRow.toCurrency];

        if (!isDefined(toAccount)) {
            throw new Error(`To Account ${normalizedRow.toAccount} in column "${this.columnMap.toAccount}" not found`);
        }

        if (!isDefined(category)) {
            throw new Error(`Category "${normalizedRow.category}" in column "${this.columnMap.category}" not found`);
        }

        if (!isDefined(operatedAt) || isNaN(operatedAt.getTime())) {
            throw new Error(`Date "${normalizedRow.operatedAt}" in column "${this.columnMap.operatedAt}" is invalid`);
        }

        if (!isDefined(amount) || isNaN(amount)) {
            throw new Error(`Amount "${normalizedRow.amount}" in column "${this.columnMap.amount} is invalid"`);
        }

        if (!isDefined(toInstrument)) {
            throw new Error(`To Instrument ${normalizedRow.toCurrency} in column "${this.columnMap.toCurrency}" not found`);
        }

        return {
            toAccount,
            fromAccount,
            category,
            operatedAt,
            amount,
            fromInstrument,
            toInstrument
        };
    }

    private getToAccountKey(normalizedRow: Record<keyof ImporterColumnMapInterface, string>): string {
        return `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;
    }

    private getFromAccountKey(normalizedRow: Record<keyof ImporterColumnMapInterface, string>): string {
        return `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;
    }

    private async processRows(
        csvText: string,
        onRow: (normalizeRow: Record<keyof ImporterColumnMapInterface, string>, originalRow: Record<string, string>) => void
    ) {
        return new Promise<void>((resolve, reject) => {
            Papa.parse<Record<string, string>>(csvText, {
                header: true,
                skipEmptyLines: true,
                chunk: ({ data }: ParseResult<Record<string, string>>) => {
                    for (const row of data) {
                        onRow(this.normalizeRow(row), row);
                    }
                },
                complete: () => void resolve(),
                error: (error: Error) => void reject(error)
            });
        });
    }
}
