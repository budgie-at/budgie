/* eslint-disable lingui/no-unlocalized-strings,no-console */
import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    ExternalSourceEnum,
    InstrumentEntityInterface,
    TransactionCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { parse } from 'date-fns';
import Papa, { ParseStepResult } from 'papaparse';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { categoryService } from '../../category/service/category.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { ImportProgressInterface } from '../interface/import-progress.interface';
import { ImporterColumnMapInterface } from '../interface/importer-column-map.interface';
import { ImporterRowInterface } from '../interface/importer-row.interface';

type NormalizedRow = Record<keyof ImporterColumnMapInterface, string>;

interface EntryParams {
    amount: number;
    firstEntryType: TransactionEntryTypeEnum;
    toInstrument: InstrumentEntityInterface;
    toAccount: AccountEntityInterface;
    category: CategoryEntityInterface;
    fromAccount: AccountEntityInterface | null;
    fromInstrument: InstrumentEntityInterface | null;
}

interface ValidationParams {
    normalizedRow: NormalizedRow;
    toAccount?: AccountEntityInterface;
    category?: CategoryEntityInterface;
    operatedAt: Date;
    amount: number;
    toInstrument?: InstrumentEntityInterface;
}

export class ImporterService {
    private instrumentsMap: Record<string, InstrumentEntityInterface> = {};
    private accountsMap: Record<string, AccountEntityInterface> = {};
    private categoriesMap: Record<string, CategoryEntityInterface> = {};

    constructor(private readonly columnMap: ImporterColumnMapInterface) {}

    async process(csvText: string, totalRows: number): Promise<ImportProgressInterface> {
        const progress: ImportProgressInterface = { total: totalRows, processed: 0, successful: 0, errors: 0 };

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

    private async processTransactions(csvText: string, progress: ImportProgressInterface): Promise<TransactionCreateEntityInterface[]> {
        const transactions: TransactionCreateEntityInterface[] = [];

        await this.processRows(csvText, (normalizedRow, row) => {
            progress.processed += 1;
            try {
                const transaction = this.createTransaction(normalizedRow);
                transactions.push(transaction);
                progress.successful += 1;
            } catch (error) {
                progress.errors += 1;
                console.log(`Error processing row: ${getErrorMessage(error)}`, row);
            }
        });

        return transactions;
    }

    private createTransaction(normalizedRow: NormalizedRow): TransactionCreateEntityInterface {
        const { toAccount, fromAccount, category, operatedAt, amount, fromInstrument, toInstrument } = this.parseRow(normalizedRow);

        this.validateParsedRow({ normalizedRow, toAccount, category, operatedAt, amount, toInstrument });

        const { type, firstEntryType } = this.determineTransactionType(amount, fromInstrument);

        return {
            type,
            operatedAt,
            amount: type === TransactionTypeEnum.TRANSFER ? Math.abs(amount) : amount,
            externalId: normalizedRow.externalId,
            title: '',
            externalSource: ExternalSourceEnum.CSV,
            comment: normalizedRow.comment,
            toAccountId: toAccount.id,
            fromAccountId: isDefined(fromAccount) ? fromAccount.id : null,
            exchangeRate: 0,
            tagIds: [],
            entries: this.createEntries({ amount, firstEntryType, toInstrument, toAccount, category, fromAccount, fromInstrument })
        };
    }

    private determineTransactionType(
        amount: number,
        fromInstrument: InstrumentEntityInterface | undefined
    ): { type: TransactionTypeEnum; firstEntryType: TransactionEntryTypeEnum } {
        if (isDefined(fromInstrument)) {
            return { type: TransactionTypeEnum.TRANSFER, firstEntryType: TransactionEntryTypeEnum.DEBIT };
        }
        if (amount > 0) {
            return { type: TransactionTypeEnum.INCOME, firstEntryType: TransactionEntryTypeEnum.CREDIT };
        }

        return { type: TransactionTypeEnum.EXPENSE, firstEntryType: TransactionEntryTypeEnum.DEBIT };
    }

    private createEntries(params: EntryParams): TransactionCreateEntityInterface['entries'] {
        const { amount, firstEntryType, toInstrument, toAccount, category, fromAccount, fromInstrument } = params;

        const entries: TransactionCreateEntityInterface['entries'] = [
            {
                amount: Math.abs(amount),
                type: firstEntryType,
                instrumentId: toInstrument.id,
                accountId: toAccount.id,
                categoryId: category.id
            }
        ];

        if (isDefined(fromAccount) && isDefined(fromInstrument)) {
            entries.push({
                amount: Math.abs(amount),
                type: TransactionEntryTypeEnum.CREDIT,
                instrumentId: fromInstrument.id,
                accountId: fromAccount.id,
                categoryId: category.id
            });
        }

        return entries;
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
            amount: getValue(this.columnMap.amount).trim(),
            fromCurrency: getValue(this.columnMap.fromCurrency).toUpperCase().trim(),
            toCurrency: getValue(this.columnMap.toCurrency).toUpperCase().trim()
        } satisfies NormalizedRow;
    }

    private parseRow(normalizedRow: NormalizedRow): ImporterRowInterface {
        const toAccount = this.accountsMap[this.getToAccountKey(normalizedRow)];
        const fromAccount = this.accountsMap[this.getFromAccountKey(normalizedRow)];
        const category = this.categoriesMap[normalizedRow.category];
        const operatedAt = parse(normalizedRow.operatedAt, 'MM/dd/yyyy HH:mm:ss', new Date());
        const amount = parseFloat(normalizedRow.amount);
        const fromInstrument = this.instrumentsMap[normalizedRow.fromCurrency];
        const toInstrument = this.instrumentsMap[normalizedRow.toCurrency];

        return { toAccount, fromAccount, category, operatedAt, amount, fromInstrument, toInstrument };
    }

    private validateParsedRow(params: ValidationParams): void {
        const { normalizedRow, toAccount, category, operatedAt, amount, toInstrument } = params;

        if (!isDefined(toAccount)) {
            throw new Error(`To Account ${normalizedRow.toAccount} not found`);
        }
        if (!isDefined(category)) {
            throw new Error(`Category "${normalizedRow.category}" not found`);
        }
        if (!isDefined(operatedAt) || isNaN(operatedAt.getTime())) {
            throw new Error(`Date "${normalizedRow.operatedAt}" is invalid`);
        }
        if (!isDefined(amount) || isNaN(amount)) {
            throw new Error(`Amount "${normalizedRow.amount}" is invalid`);
        }
        if (!isDefined(toInstrument)) {
            throw new Error(`Currency ${normalizedRow.toCurrency} not found`);
        }
    }

    private getToAccountKey(normalizedRow: NormalizedRow): string {
        return `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;
    }

    private getFromAccountKey(normalizedRow: NormalizedRow): string {
        return `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;
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
