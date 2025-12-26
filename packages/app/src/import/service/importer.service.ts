/* eslint-disable lingui/no-unlocalized-strings,max-lines */
import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    ExternalSourceEnum,
    InstrumentEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { isValid, parse } from 'date-fns';
import Papa, { ParseStepResult } from 'papaparse';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { categoryRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { categoryService } from '../../category/service/category.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { ImportProgressInterface } from '../interface/import-progress.interface';
import { ImporterColumnMapInterface } from '../interface/importer-column-map.interface';
import { ImporterRowInterface } from '../interface/importer-row.interface';

type NormalizedRow = Record<keyof ImporterColumnMapInterface, string>;

interface EntryParams {
    account: AccountEntityInterface;
    amount: number;
    instrument: InstrumentEntityInterface;
}

interface ValidationParams {
    normalizedRow: NormalizedRow;
    toAccount?: AccountEntityInterface;
    category?: CategoryEntityInterface;
    operatedAt: Date;
    toAmount: number;
    toInstrument?: InstrumentEntityInterface;
    fromInstrument?: InstrumentEntityInterface;
    fromAmount?: number;
    isPlanned?: boolean;
}

export class ImporterService {
    private instrumentsMap: Record<string, InstrumentEntityInterface> = {};
    private accountsMap: Record<string, AccountEntityInterface> = {};
    private categoriesMap: Record<string, CategoryEntityInterface> = {};
    private fallbackCategory: CategoryEntityInterface = {} as CategoryEntityInterface;

    constructor(private readonly columnMap: ImporterColumnMapInterface) {}

    async process(csvText: string, totalRows: number): Promise<ImportProgressInterface> {
        const progress: ImportProgressInterface = { total: totalRows, processed: 0, successful: 0, errors: 0 };

        [this.fallbackCategory] = await categoryRepository.findBySearchQuery('Other', true);
        this.instrumentsMap = await this.initializeInstruments();

        const { accountInputs, categoryInputs } = await this.collectEntities(csvText);

        this.accountsMap = await accountService.bulkCreate([...accountInputs.values()]);
        this.categoriesMap = await categoryService.bulkCreate([...categoryInputs.values()]);

        const transactions = await this.processTransactions(csvText, progress);
        await transactionService.bulkCreate(transactions);

        return progress;
    }

    private async initializeInstruments(): Promise<Record<string, InstrumentEntityInterface>> {
        const instruments = await instrumentRepository.getAll();

        return instruments.reduce<Record<string, InstrumentEntityInterface>>(
            (acc, instrument) => ({ ...acc, [instrument.code]: instrument }),
            {}
        );
    }

    private async collectEntities(csvText: string): Promise<{
        accountInputs: Map<string, AccountCreateEntityInterface>;
        categoryInputs: Map<string, CategoryCreateEntityInterface>;
    }> {
        const accountInputs = new Map<string, AccountCreateEntityInterface>();
        const categoryInputs = new Map<string, CategoryCreateEntityInterface>();

        await this.processRows(csvText, normalizedRow => {
            const toAccountKey = this.getToAccountKey(normalizedRow);
            if (!accountInputs.has(toAccountKey) && isNotEmptyString(normalizedRow.toCurrency)) {
                accountInputs.set(toAccountKey, this.createAccountInput(toAccountKey, normalizedRow.toCurrency));
            }

            const fromAccountKey = this.getFromAccountKey(normalizedRow);
            if (!accountInputs.has(fromAccountKey) && isNotEmptyString(normalizedRow.fromCurrency)) {
                accountInputs.set(fromAccountKey, this.createAccountInput(fromAccountKey, normalizedRow.fromCurrency));
            }

            if (isNotEmptyString(normalizedRow.category)) {
                categoryInputs.set(normalizedRow.category, { title: normalizedRow.category, icon: UserIconNameEnum.Home });
            }
        });

        return { accountInputs, categoryInputs };
    }

    private createAccountInput(title: string, currency: string): AccountCreateEntityInterface {
        return {
            title,
            type: AccountTypeEnum.BANK,
            icon: UserIconNameEnum.Home,
            nature: AccountNatureEnum.LIABILITY,
            instrumentId: this.instrumentsMap[currency].id,
            currentBalance: 0
        };
    }

    private async processTransactions(csvText: string, progress: ImportProgressInterface): Promise<TransactionCreateInputInterface[]> {
        const transactions: TransactionCreateInputInterface[] = [];

        await this.processRows(csvText, (normalizedRow, row) => {
            progress.processed += 1;
            try {
                const transaction = this.createTransaction(normalizedRow);
                transactions.push(transaction);
                progress.successful += 1;
            } catch (error) {
                progress.errors += 1;
                // eslint-disable-next-line no-console
                console.log(`Error processing row: ${getErrorMessage(error)}`, row);
            }
        });

        return transactions;
    }

    private createTransaction(normalizedRow: NormalizedRow): TransactionCreateInputInterface {
        const { toAccount, fromAccount, category, operatedAt, toAmount, fromInstrument, toInstrument, fromAmount } =
            this.parseRow(normalizedRow);

        this.validateParsedRow({ normalizedRow, toAccount, category, operatedAt, toAmount, toInstrument });

        const type = this.determineTransactionType(toAmount, fromInstrument);

        const source: EntryParams = {
            account: isDefined(fromAccount) ? fromAccount : toAccount,
            instrument: isDefined(fromInstrument) ? fromInstrument : toInstrument,
            amount: isDefined(fromAmount) ? fromAmount : toAmount
        };

        const dest: EntryParams | null = isDefined(fromAccount)
            ? {
                  account: toAccount,
                  instrument: toInstrument,
                  amount: toAmount
              }
            : null;

        return {
            type,
            operatedAt,
            exchangeRate: isDefined(dest) ? dest.amount / source.amount : 1,
            amount: type === TransactionTypeEnum.TRANSFER ? Math.abs(dest?.amount ?? source.amount) : source.amount,
            externalId: normalizedRow.externalId,
            title: '',
            externalSource: ExternalSourceEnum.CSV,
            comment: normalizedRow.comment,
            toAccountId: source.account.id,
            fromAccountId: dest?.account.id ?? null,
            tagIds: [],
            entries: this.createEntries(type, category, source, dest)
        };
    }

    private determineTransactionType(amount: number, fromInstrument: InstrumentEntityInterface | null): TransactionTypeEnum {
        if (isDefined(fromInstrument)) {
            return TransactionTypeEnum.TRANSFER;
        }

        if (amount > 0) {
            return TransactionTypeEnum.INCOME;
        }

        return TransactionTypeEnum.EXPENSE;
    }

    private createEntries(
        type: TransactionTypeEnum,
        category: CategoryEntityInterface,
        source: EntryParams,
        dest: EntryParams | null
    ): TransactionEntryCreateInputInterface[] {
        if (type === TransactionTypeEnum.INCOME) {
            return [
                {
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: Math.abs(source.amount),
                    accountId: source.account.id,
                    categoryId: category.id
                }
            ];
        } else if (type === TransactionTypeEnum.EXPENSE) {
            return [
                {
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: Math.abs(source.amount),
                    accountId: source.account.id,
                    categoryId: category.id
                }
            ];
        } else if (type === TransactionTypeEnum.TRANSFER && isDefined(dest)) {
            return [
                {
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: Math.abs(source.amount),
                    accountId: source.account.id,
                    categoryId: category.id
                },
                {
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: Math.abs(dest.amount),
                    accountId: dest.account.id,
                    categoryId: category.id
                }
            ];
        }

        return [];
    }

    private normalizeRow(row: Record<string, string>): NormalizedRow {
        const getValue = (key: string): string => row[key] ?? '';

        return {
            externalId: getValue(this.columnMap.externalId).trim(),
            toAccount: getValue(this.columnMap.toAccount).toLowerCase().trim(),
            fromAccount: getValue(this.columnMap.fromAccount).toLowerCase().trim(),
            category: getValue(this.columnMap.category).toLowerCase().trim(),
            operatedAt: getValue(this.columnMap.operatedAt).toLowerCase().trim(),
            comment: getValue(this.columnMap.comment).trim(),
            toAmount: getValue(this.columnMap.toAmount).trim(),
            fromCurrency: getValue(this.columnMap.fromCurrency).toUpperCase().trim(),
            fromAmount: getValue(this.columnMap.fromAmount).trim(),
            toCurrency: getValue(this.columnMap.toCurrency).toUpperCase().trim(),
            isPlanned: getValue(this.columnMap.isPlanned).trim()
        } satisfies NormalizedRow;
    }

    private parseRow(normalizedRow: NormalizedRow): ImporterRowInterface {
        const toAccount = this.accountsMap[this.getToAccountKey(normalizedRow)];
        const toAmount = parseFloat(normalizedRow.toAmount);
        const toInstrument = this.instrumentsMap[normalizedRow.toCurrency];
        const category = this.categoriesMap[normalizedRow.category] ?? this.fallbackCategory;
        const operatedAt = this.parseDate(normalizedRow.operatedAt);
        const fromAccount = this.accountsMap[this.getFromAccountKey(normalizedRow)];
        const fromInstrument = isDefined(fromAccount) ? this.instrumentsMap[normalizedRow.fromCurrency] : null;
        const fromAmount = isDefined(fromAccount) ? parseFloat(normalizedRow.fromAmount) : null;
        const isPlanned = normalizedRow.isPlanned === '1';

        return { toAccount, fromAccount, category, operatedAt, toAmount, fromInstrument, toInstrument, fromAmount, isPlanned };
    }

    // eslint-disable-next-line max-statements
    private validateParsedRow(params: ValidationParams): void {
        const { normalizedRow, toAccount, category, operatedAt, toAmount, toInstrument, fromInstrument, fromAmount } = params;

        if (!isDefined(toAccount)) {
            throw new Error(`To Account ${normalizedRow.toAccount} not found`);
        }
        if (!isDefined(category)) {
            throw new Error(`Category "${normalizedRow.category}" not found`);
        }
        if (!isDefined(operatedAt) || isNaN(operatedAt.getTime())) {
            throw new Error(`Date "${normalizedRow.operatedAt}" is invalid`);
        }
        if (!isDefined(toAmount) || isNaN(toAmount)) {
            throw new Error(`To Amount "${normalizedRow.toAmount}" is invalid`);
        }
        if (!isDefined(toInstrument)) {
            throw new Error(`Currency ${normalizedRow.toCurrency} not found`);
        }
        if (isDefined(fromInstrument) && (!isDefined(fromAmount) || isNaN(fromAmount))) {
            throw new Error(`From Amount "${normalizedRow.fromAmount}" is invalid`);
        }
    }

    private getToAccountKey(normalizedRow: NormalizedRow): string {
        return `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;
    }

    private getFromAccountKey(normalizedRow: NormalizedRow): string {
        return `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;
    }

    private parseDate(dateString: string): Date {
        const primaryFormat = parse(dateString, 'MM/dd/yyyy HH:mm:ss', new Date());
        if (isValid(primaryFormat)) {
            return primaryFormat;
        }

        return parse(dateString, 'yyyy-MM-dd', new Date());
    }

    private async processRows(
        csvText: string,
        onRow: (normalizeRow: NormalizedRow, originalRow: Record<string, string>) => void
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Papa.parse<Record<string, string>>(csvText, {
                header: true,
                skipEmptyLines: true,
                step: (row: ParseStepResult<Record<string, string>>) => {
                    onRow(this.normalizeRow(row.data), row.data);
                },
                complete: () => void resolve(),
                error: (error: Error) => void reject(error)
            });
        });
    }
}
