/* oxlint-disable lingui/no-unlocalized-strings */
import {
    AccountEntityInterface,
    AccountTypeEnum,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    CategorySourceEnum,
    ExternalSourceEnum,
    InstrumentEntityInterface,
    LiabilityAccountCreateInputInterface,
    MccCategoryLookupInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import * as Effect from 'effect/Effect';
import * as Result from 'effect/Result';
import Papa, { ParseStepResult } from 'papaparse';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { DEFAULT_CATEGORY_ICON } from '../../category/constant/default-category-icon.constant';
import { categoryService } from '../../category/service/category.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { loadMccCategoryLookupMap } from '../../sync/util/load-mcc-category-lookup-map.util';
import { transactionService } from '../../transaction/service/transaction.service';

import type { CreateEntriesParamsInterface } from '../interface/create-entries-params.interface';
import type { EntryParamsInterface } from '../interface/entry-params.interface';
import type { ImportProgressInterface } from '../interface/import-progress.interface';
import type { ImporterColumnMapInterface } from '../interface/importer-column-map.interface';
import type { ImporterRowInterface } from '../interface/importer-row.interface';
import type { NormalizedRowType } from '../type/normalized-row.type';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class ImporterService {
    readonly process = Effect.fn('ImporterService.process')(function* (this: ImporterService, csvText: string, totalRows: number) {
        const progress: ImportProgressInterface = { total: totalRows, processed: 0, successful: 0, errors: 0 };

        this.instrumentsMap = yield* this.initializeInstruments();
        this.mccCategoryLookupMap = yield* loadMccCategoryLookupMap();

        const { accountInputs, categoryInputs } = yield* this.collectEntities(csvText);

        this.accountsMap = yield* accountService.bulkCreate([...accountInputs.values()]);
        this.categoriesMap = yield* categoryService.bulkCreate([...categoryInputs.values()]);

        const transactions = yield* this.processTransactions(csvText, progress);
        const createdTransactions = yield* transactionService.bulkCreate(transactions);

        yield* ruleApplicationDrainerService.enqueueTransactions(
            createdTransactions.map(transaction => transaction.id),
            transactions
        );

        return progress;
    });

    private readonly initializeInstruments = Effect.fn('ImporterService.initializeInstruments')(function* () {
        const instruments = yield* instrumentRepository.getAll();

        return instruments.reduce<Record<string, InstrumentEntityInterface>>(
            (acc, instrument) => ({ ...acc, [instrument.code]: instrument }),
            {}
        );
    });

    private readonly collectEntities = Effect.fn('ImporterService.collectEntities')(function* (this: ImporterService, csvText: string) {
        const accountInputs = new Map<string, LiabilityAccountCreateInputInterface>();
        const categoryInputs = new Map<string, CategoryCreateEntityInterface>();

        yield* this.processRows(csvText, normalizedRow => {
            const toAccountKey = this.getToAccountKey(normalizedRow);
            if (!accountInputs.has(toAccountKey) && isNotEmptyString(normalizedRow.toCurrency)) {
                accountInputs.set(toAccountKey, this.createAccountInput(toAccountKey, normalizedRow.toCurrency));
            }

            const fromAccountKey = this.getFromAccountKey(normalizedRow);
            if (!accountInputs.has(fromAccountKey) && isNotEmptyString(normalizedRow.fromCurrency)) {
                accountInputs.set(fromAccountKey, this.createAccountInput(fromAccountKey, normalizedRow.fromCurrency));
            }

            if (isNotEmptyString(normalizedRow.category)) {
                categoryInputs.set(normalizedRow.category, { title: normalizedRow.category, icon: DEFAULT_CATEGORY_ICON });
            }
        });

        return { accountInputs, categoryInputs };
    });

    private readonly processTransactions = Effect.fn('ImporterService.processTransactions')(function* (
        this: ImporterService,
        csvText: string,
        progress: ImportProgressInterface
    ) {
        const transactions: TransactionCreateInputInterface[] = [];
        const rowErrors: Record<string, string>[] = [];

        yield* this.processRows(csvText, (normalizedRow, row) => {
            progress.processed += 1;

            const transaction = this.createTransaction(normalizedRow);

            if (Result.isSuccess(transaction)) {
                transactions.push(transaction.success);
                progress.successful += 1;
            } else {
                progress.errors += 1;
                rowErrors.push({ errorMessage: transaction.failure, rowColumns: Object.keys(row).join(',') });
            }
        });
        yield* Effect.forEach(rowErrors, rowError => Effect.logError('row:process-error', rowError), { discard: true });

        return transactions;
    });

    private readonly processRows = Effect.fn('ImporterService.processRows')(function* (
        this: ImporterService,
        csvText: string,
        onRow: (normalizeRow: NormalizedRowType, originalRow: Record<string, string>) => void
    ) {
        yield* Effect.callback<unknown, Error>(resume => {
            Papa.parse<Record<string, string>>(csvText, {
                header: true,
                skipEmptyLines: true,
                step: (row: ParseStepResult<Record<string, string>>) => {
                    onRow(this.normalizeRow(row.data), row.data);
                },
                complete: () => {
                    resume(Effect.void);
                },
                error: (error: Error) => {
                    resume(Effect.fail(error));
                }
            });
        });
    });

    private instrumentsMap: Record<string, InstrumentEntityInterface> = {};
    private accountsMap: Record<string, AccountEntityInterface> = {};
    private categoriesMap: Record<string, CategoryEntityInterface | undefined> = {};
    private mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

    constructor(private readonly columnMap: ImporterColumnMapInterface) {}

    private createAccountInput(title: string, currency: string): LiabilityAccountCreateInputInterface {
        return {
            title,
            parentId: null,
            currentBalance: 0,
            includeInNetWorth: true,
            type: AccountTypeEnum.BANK,
            icon: UserIconNameEnum.Home,
            instrumentId: this.instrumentsMap[currency].id
        };
    }

    private createTransaction(normalizedRow: NormalizedRowType): Result.Result<TransactionCreateInputInterface, string> {
        return Result.map(this.parseRow(normalizedRow), parsedRow => this.buildTransaction(normalizedRow, parsedRow));
    }

    private buildTransaction(normalizedRow: NormalizedRowType, parsedRow: ImporterRowInterface): TransactionCreateInputInterface {
        const {
            toAccount,
            fromAccount,
            categoryId,
            categorySource,
            mccCategoryId,
            operatedAt,
            toAmount,
            fromInstrument,
            toInstrument,
            fromAmount
        } = parsedRow;

        const type = this.determineTransactionType(toAmount, fromInstrument);

        const source: EntryParamsInterface = {
            account: isDefined(fromAccount) ? fromAccount : toAccount,
            instrument: isDefined(fromInstrument) ? fromInstrument : toInstrument,
            amount: isDefined(fromAmount) ? fromAmount : toAmount
        };

        const dest: EntryParamsInterface | null = isDefined(fromAccount)
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
            updatedBy: null,
            externalSource: ExternalSourceEnum.CSV,
            comment: normalizedRow.comment,
            toAccountId: source.account.id,
            fromAccountId: dest?.account.id ?? null,
            tagIds: [],
            entries: this.createEntries({
                type,
                categoryId,
                categorySource,
                mccCategoryId,
                source,
                dest,
                externalId: normalizedRow.externalId
            })
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

    private createEntries({
        type,
        categoryId,
        categorySource,
        source,
        dest,
        externalId,
        mccCategoryId
    }: CreateEntriesParamsInterface): TransactionEntryCreateInputInterface[] {
        const entryExternalId = externalId ?? null;

        if (type === TransactionTypeEnum.INCOME || type === TransactionTypeEnum.EXPENSE) {
            return [
                {
                    type: type === TransactionTypeEnum.INCOME ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                    amount: Math.abs(source.amount),
                    accountId: source.account.id,
                    categoryId,
                    categorySource,
                    mccCategoryId,
                    externalId: entryExternalId
                }
            ];
        } else if (type === TransactionTypeEnum.TRANSFER && isDefined(dest)) {
            return [
                {
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: Math.abs(source.amount),
                    accountId: source.account.id,
                    categoryId,
                    categorySource,
                    mccCategoryId: null,
                    externalId: entryExternalId
                },
                {
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: Math.abs(dest.amount),
                    accountId: dest.account.id,
                    categoryId,
                    categorySource,
                    mccCategoryId: null,
                    externalId: entryExternalId
                }
            ];
        }

        return [];
    }

    private normalizeRow(row: Record<string, string>): NormalizedRowType {
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
            isPlanned: getValue(this.columnMap.isPlanned).trim(),
            mcc: getValue(this.columnMap.mcc).trim()
        } satisfies NormalizedRowType;
    }

    // eslint-disable-next-line max-statements
    private parseRow(normalizedRow: NormalizedRowType): Result.Result<ImporterRowInterface, string> {
        const toAccount = this.accountsMap[this.getToAccountKey(normalizedRow)];
        const toAmount = parseFloat(normalizedRow.toAmount);
        const toInstrument = this.instrumentsMap[normalizedRow.toCurrency];
        const explicitCategory = this.categoriesMap[normalizedRow.category];
        const operatedAt = this.parseDate(normalizedRow.operatedAt);
        const fromAccount = this.accountsMap[this.getFromAccountKey(normalizedRow)];
        const fromInstrument = isDefined(fromAccount) ? this.instrumentsMap[normalizedRow.fromCurrency] : null;
        const fromAmount = isDefined(fromAccount) ? parseFloat(normalizedRow.fromAmount) : null;
        const isPlanned = normalizedRow.isPlanned === '1';

        if (!isDefined(toAccount)) {
            return Result.fail(`To Account ${normalizedRow.toAccount} not found`);
        }
        if (!isDefined(operatedAt) || isNaN(operatedAt.getTime())) {
            return Result.fail(`Date "${normalizedRow.operatedAt}" is invalid`);
        }
        if (!isDefined(toAmount) || isNaN(toAmount)) {
            return Result.fail(`To Amount "${normalizedRow.toAmount}" is invalid`);
        }
        if (!isDefined(toInstrument)) {
            return Result.fail(`Currency ${normalizedRow.toCurrency} not found`);
        }
        if (isDefined(fromInstrument) && (!isDefined(fromAmount) || isNaN(fromAmount))) {
            return Result.fail(`From Amount "${normalizedRow.fromAmount}" is invalid`);
        }

        const mccLookup = isNotEmptyString(normalizedRow.mcc) ? (this.mccCategoryLookupMap.get(normalizedRow.mcc) ?? null) : null;
        const mccCategoryId = mccLookup?.id ?? null;
        const useMccDefault = !isDefined(explicitCategory) && isDefined(mccLookup) && isPositiveNumber(mccLookup.defaultCategoryId);
        const categoryId = useMccDefault ? mccLookup.defaultCategoryId : (explicitCategory?.id ?? null);
        const categorySource = useMccDefault ? CategorySourceEnum.MCC_DEFAULT : CategorySourceEnum.USER;

        return Result.succeed({
            toAccount,
            fromAccount,
            categoryId,
            categorySource,
            mccCategoryId,
            operatedAt,
            toAmount,
            fromInstrument,
            toInstrument,
            fromAmount,
            isPlanned
        });
    }

    private getToAccountKey(normalizedRow: NormalizedRowType): string {
        return `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;
    }

    private getFromAccountKey(normalizedRow: NormalizedRowType): string {
        return `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;
    }

    private parseDate(dateString: string): Date {
        const primaryFormat = parse(dateString, 'MM/dd/yyyy HH:mm:ss', new Date());
        if (isValid(primaryFormat)) {
            return primaryFormat;
        }

        return parse(dateString, 'yyyy-MM-dd', new Date());
    }
}
