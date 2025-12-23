import { parse } from 'date-fns';
import Papa, { ParseStepResult } from 'papaparse';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';
import { DB } from '../../@generic/type/db.type';
import { AccountCreateEntityInterface } from '../../account/entity/account-create-entity.interface';
import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { AccountNatureEnum } from '../../account/enum/account-nature.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountService } from '../../account/service/account.service';
import { CategoryCreateEntityInterface } from '../../category/entity/category-create-entity.interface';
import { CategoryEntityInterface } from '../../category/entity/category-entity.interface';
import { CategoryService } from '../../category/service/category.service';
import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity.interface';
import { InstrumentRepository } from '../../instrument/repository/instrument.repository';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionService } from '../../transaction/service/transaction.service';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { ImportProgressInterface } from '../interface/import-progress.interface';
import { ImporterColumnMapInterface } from '../interface/importer-column-map.interface';
import { ImporterRowInterface } from '../interface/importer-row.interface';
import { TransactionCreateInputInterface } from '../../transaction/input/transaction-create-input.interface';

type NormalizedRow = Record<keyof ImporterColumnMapInterface, string>;

interface EntryParams {
    toAmount: number;
    toAccount: AccountEntityInterface;
    firstEntryType: TransactionEntryTypeEnum;
    category: CategoryEntityInterface;
    fromAccount: AccountEntityInterface | null;
    fromAmount: number | null;
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
}

export class ImporterService {
    private accountService: AccountService;
    private categoryService: CategoryService;
    private transactionService: TransactionService;
    private instrumentRepository: InstrumentRepository;

    private instrumentsMap: Record<string, InstrumentEntityInterface> = {};
    private accountsMap: Record<string, AccountEntityInterface> = {};
    private categoriesMap: Record<string, CategoryEntityInterface> = {};

    constructor(
        readonly db: DB,
        private readonly columnMap: ImporterColumnMapInterface
    ) {
        this.accountService = new AccountService(db);
        this.categoryService = new CategoryService(db);
        this.transactionService = new TransactionService(db);
        this.instrumentRepository = new InstrumentRepository(db);
    }

    async process(csvText: string, totalRows: number): Promise<ImportProgressInterface> {
        const progress: ImportProgressInterface = { total: totalRows, processed: 0, successful: 0, errors: 0 };

        this.instrumentsMap = await this.initializeInstruments();

        const { accountInputs, categoryInputs } = await this.collectEntities(csvText);

        this.accountsMap = await this.accountService.bulkCreate([...accountInputs.values()]);
        this.categoriesMap = await this.categoryService.bulkCreate([...categoryInputs.values()]);

        const transactions = await this.processTransactions(csvText, progress);
        await this.transactionService.bulkCreate(transactions);

        return progress;
    }

    private async initializeInstruments(): Promise<Record<string, InstrumentEntityInterface>> {
        const instruments = await this.instrumentRepository.getAll();

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
                // eslint-disable-next-line
                console.log(`Error processing row: ${getErrorMessage(error)}`, row);
            }
        });

        return transactions;
    }

    private createTransaction(normalizedRow: NormalizedRow): TransactionCreateInputInterface {
        const { toAccount, fromAccount, category, operatedAt, toAmount, fromInstrument, toInstrument, fromAmount } =
            this.parseRow(normalizedRow);

        this.validateParsedRow({ normalizedRow, toAccount, category, operatedAt, toAmount, toInstrument });

        const { type, firstEntryType } = this.determineTransactionType(toAmount, fromInstrument);

        return {
            type,
            operatedAt,
            amount: type === TransactionTypeEnum.TRANSFER ? Math.abs(toAmount) : toAmount,
            externalId: normalizedRow.externalId,
            title: '',
            externalSource: ExternalSourceEnum.CSV,
            comment: normalizedRow.comment,
            toAccountId: toAccount.id,
            fromAccountId: isDefined(fromAccount) ? fromAccount.id : null,
            exchangeRate: 0,
            tagIds: [],
            entries: this.createEntries({
                toAmount,
                fromAmount,
                firstEntryType,
                toAccount,
                category,
                fromAccount
            })
        };
    }

    private determineTransactionType(
        amount: number,
        fromInstrument: InstrumentEntityInterface | null
    ): { type: TransactionTypeEnum; firstEntryType: TransactionEntryTypeEnum } {
        if (isDefined(fromInstrument)) {
            return { type: TransactionTypeEnum.TRANSFER, firstEntryType: TransactionEntryTypeEnum.DEBIT };
        }
        if (amount > 0) {
            return { type: TransactionTypeEnum.INCOME, firstEntryType: TransactionEntryTypeEnum.CREDIT };
        }

        return { type: TransactionTypeEnum.EXPENSE, firstEntryType: TransactionEntryTypeEnum.DEBIT };
    }

    private createEntries(params: EntryParams): TransactionCreateInputInterface['entries'] {
        const { toAmount, firstEntryType, toAccount, category, fromAccount, fromAmount } = params;

        const entries: TransactionCreateInputInterface['entries'] = [
            {
                amount: Math.abs(toAmount),
                type: firstEntryType,
                accountId: toAccount.id,
                categoryId: category.id
            }
        ];

        if (isDefined(fromAccount) && isDefined(fromAmount) && !isNaN(fromAmount)) {
            entries.push({
                amount: Math.abs(fromAmount),
                type: TransactionEntryTypeEnum.CREDIT,
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
            toAmount: getValue(this.columnMap.toAmount).trim(),
            fromCurrency: getValue(this.columnMap.fromCurrency).toUpperCase().trim(),
            fromAmount: getValue(this.columnMap.fromAmount).trim(),
            toCurrency: getValue(this.columnMap.toCurrency).toUpperCase().trim()
        } satisfies NormalizedRow;
    }

    private parseRow(normalizedRow: NormalizedRow): ImporterRowInterface {
        const toAccount = this.accountsMap[this.getToAccountKey(normalizedRow)];
        const toAmount = parseFloat(normalizedRow.toAmount);
        const toInstrument = this.instrumentsMap[normalizedRow.toCurrency];
        const fromAccount = this.accountsMap[this.getFromAccountKey(normalizedRow)];
        const category = this.categoriesMap[normalizedRow.category];
        const operatedAt = parse(normalizedRow.operatedAt, 'MM/dd/yyyy HH:mm:ss', new Date());
        const fromInstrument = this.instrumentsMap[normalizedRow.fromCurrency];
        const fromAmount = parseFloat(normalizedRow.fromAmount);

        return { toAccount, fromAccount, category, operatedAt, toAmount, fromInstrument, toInstrument, fromAmount };
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
