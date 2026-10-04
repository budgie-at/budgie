import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    CategoryCreateEntityInterface,
    CategoryRepository,
    CategorySourceEnum,
    DEFAULT_CATEGORY_ICON,
    ExternalSourceEnum,
    InstrumentEntityInterface,
    InstrumentRepository,
    LiabilityAccountCreateInputInterface,
    loadMccCategoryLookupMap,
    MccCategoryRepository,
    TransactionEntryCreateInputInterface,
    TransactionEntryRepository,
    TransactionRepository,
    SettingsRepository,
    TransactionTagsRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, AccountService, CategoryService, TransactionService } from '@budgie/ledger';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Result from 'effect/Result';
import Papa, { ParseStepResult } from 'papaparse';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ImportRowError } from '../error/import-row.error';

import type { CreateEntriesParamsInterface } from '../interface/create-entries-params.interface';
import type { CsvImportResultInterface } from '../interface/csv-import-result.interface';
import type { EntryParamsInterface } from '../interface/entry-params.interface';
import type { ImporterColumnMapInterface } from '../interface/importer-column-map.interface';
import type { ImporterLookupInterface } from '../interface/importer-lookup.interface';
import type { ImporterRowInterface } from '../interface/importer-row.interface';
import type { NormalizedRowType } from '../type/normalized-row.type';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class ImporterService extends Context.Service<ImporterService>()('@budgie/import-export/ImporterService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const categoryRepository = yield* CategoryRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const accountService = yield* AccountService;
        const categoryService = yield* CategoryService;
        const transactionService = yield* TransactionService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;

        const getToAccountKey = (normalizedRow: NormalizedRowType): string => `${normalizedRow.toAccount} ${normalizedRow.toCurrency}`;

        const getFromAccountKey = (normalizedRow: NormalizedRowType): string =>
            `${normalizedRow.fromAccount} ${normalizedRow.fromCurrency}`;

        const parseDate = (dateString: string): Date => {
            const primaryFormat = parse(dateString, 'MM/dd/yyyy HH:mm:ss', new Date());
            if (isValid(primaryFormat)) {
                return primaryFormat;
            }

            return parse(dateString, 'yyyy-MM-dd', new Date());
        };

        const createAccountInput = (
            title: string,
            currency: string,
            instrumentsMap: Record<string, InstrumentEntityInterface>
        ): LiabilityAccountCreateInputInterface => ({
            title,
            parentId: null,
            currentBalance: 0,
            includeInNetWorth: true,
            type: AccountTypeEnum.BANK,
            icon: UserIconNameEnum.Home,
            instrumentId: instrumentsMap[currency].id
        });

        const determineTransactionType = (amount: number, fromInstrument: InstrumentEntityInterface | null): TransactionTypeEnum => {
            if (isDefined(fromInstrument)) {
                return TransactionTypeEnum.TRANSFER;
            }

            if (amount > 0) {
                return TransactionTypeEnum.INCOME;
            }

            return TransactionTypeEnum.EXPENSE;
        };

        const createEntries = ({
            type,
            categoryId,
            categorySource,
            source,
            dest,
            externalId,
            mccCategoryId
        }: CreateEntriesParamsInterface): TransactionEntryCreateInputInterface[] => {
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
        };

        const buildTransaction = (normalizedRow: NormalizedRowType, parsedRow: ImporterRowInterface): TransactionCreateInputInterface => {
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

            const type = determineTransactionType(toAmount, fromInstrument);

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
                entries: createEntries({
                    type,
                    categoryId,
                    categorySource,
                    mccCategoryId,
                    source,
                    dest,
                    externalId: normalizedRow.externalId
                })
            };
        };

        const normalizeRow = (row: Record<string, string>, columnMap: ImporterColumnMapInterface): NormalizedRowType => {
            const getValue = (key: string): string => row[key] ?? '';

            return {
                externalId: getValue(columnMap.externalId).trim(),
                toAccount: getValue(columnMap.toAccount).toLowerCase().trim(),
                fromAccount: getValue(columnMap.fromAccount).toLowerCase().trim(),
                category: getValue(columnMap.category).toLowerCase().trim(),
                operatedAt: getValue(columnMap.operatedAt).toLowerCase().trim(),
                comment: getValue(columnMap.comment).trim(),
                toAmount: getValue(columnMap.toAmount).trim(),
                fromCurrency: getValue(columnMap.fromCurrency).toUpperCase().trim(),
                fromAmount: getValue(columnMap.fromAmount).trim(),
                toCurrency: getValue(columnMap.toCurrency).toUpperCase().trim(),
                isPlanned: getValue(columnMap.isPlanned).trim(),
                mcc: getValue(columnMap.mcc).trim()
            } satisfies NormalizedRowType;
        };

        const parseRow = (
            normalizedRow: NormalizedRowType,
            lookup: ImporterLookupInterface
        ): Result.Result<ImporterRowInterface, string> => {
            const toAccount = lookup.accountsMap[getToAccountKey(normalizedRow)];
            const toAmount = Number.parseFloat(normalizedRow.toAmount);
            const toInstrument = lookup.instrumentsMap[normalizedRow.toCurrency];
            const explicitCategory = lookup.categoriesMap[normalizedRow.category];
            const operatedAt = parseDate(normalizedRow.operatedAt);
            const fromAccount = lookup.accountsMap[getFromAccountKey(normalizedRow)];
            const fromInstrument = isDefined(fromAccount) ? lookup.instrumentsMap[normalizedRow.fromCurrency] : null;
            const fromAmount = isDefined(fromAccount) ? Number.parseFloat(normalizedRow.fromAmount) : null;
            const isPlanned = normalizedRow.isPlanned === '1';

            if (!isDefined(toAccount)) {
                return Result.fail(`To Account ${normalizedRow.toAccount} not found`);
            }
            if (!isDefined(operatedAt) || Number.isNaN(operatedAt.getTime())) {
                return Result.fail(`Date "${normalizedRow.operatedAt}" is invalid`);
            }
            if (!isDefined(toAmount) || Number.isNaN(toAmount)) {
                return Result.fail(`To Amount "${normalizedRow.toAmount}" is invalid`);
            }
            if (!isDefined(toInstrument)) {
                return Result.fail(`Currency ${normalizedRow.toCurrency} not found`);
            }
            if (isDefined(fromInstrument) && (!isDefined(fromAmount) || Number.isNaN(fromAmount))) {
                return Result.fail(`From Amount "${normalizedRow.fromAmount}" is invalid`);
            }

            const mccLookup = isNotEmptyString(normalizedRow.mcc) ? (lookup.mccCategoryLookupMap.get(normalizedRow.mcc) ?? null) : null;
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
        };

        const processRows = Effect.fn('ImporterService.processRows')(function* (
            csvText: string,
            columnMap: ImporterColumnMapInterface,
            onRow: (normalizeRow: NormalizedRowType, originalRow: Record<string, string>) => void
        ) {
            yield* Effect.callback<unknown, Error>(resume => {
                Papa.parse<Record<string, string>>(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    step: (row: ParseStepResult<Record<string, string>>) => {
                        onRow(normalizeRow(row.data, columnMap), row.data);
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

        const initializeInstruments = Effect.fn('ImporterService.initializeInstruments')(function* () {
            const instruments = yield* instrumentRepository.getAll();

            return instruments.reduce<Record<string, InstrumentEntityInterface>>((acc, instrument) => {
                acc[instrument.code] = instrument;

                return acc;
            }, {});
        });

        const collectEntities = Effect.fn('ImporterService.collectEntities')(function* (
            csvText: string,
            columnMap: ImporterColumnMapInterface,
            instrumentsMap: Record<string, InstrumentEntityInterface>
        ) {
            const accountInputs = new Map<string, LiabilityAccountCreateInputInterface>();
            const categoryInputs = new Map<string, CategoryCreateEntityInterface>();

            yield* processRows(csvText, columnMap, normalizedRow => {
                const toAccountKey = getToAccountKey(normalizedRow);
                if (!accountInputs.has(toAccountKey) && isNotEmptyString(normalizedRow.toCurrency)) {
                    accountInputs.set(toAccountKey, createAccountInput(toAccountKey, normalizedRow.toCurrency, instrumentsMap));
                }

                const fromAccountKey = getFromAccountKey(normalizedRow);
                if (!accountInputs.has(fromAccountKey) && isNotEmptyString(normalizedRow.fromCurrency)) {
                    accountInputs.set(fromAccountKey, createAccountInput(fromAccountKey, normalizedRow.fromCurrency, instrumentsMap));
                }

                if (isNotEmptyString(normalizedRow.category)) {
                    categoryInputs.set(normalizedRow.category, { title: normalizedRow.category, icon: DEFAULT_CATEGORY_ICON });
                }
            });

            return { accountInputs, categoryInputs };
        });

        const processTransactions = Effect.fn('ImporterService.processTransactions')(function* (
            csvText: string,
            lookup: ImporterLookupInterface
        ) {
            const transactions: TransactionCreateInputInterface[] = [];
            const rowErrors: ImportRowError[] = [];

            yield* processRows(csvText, lookup.columnMap, (normalizedRow, row) => {
                const transaction = Result.map(parseRow(normalizedRow, lookup), parsedRow => buildTransaction(normalizedRow, parsedRow));

                if (Result.isSuccess(transaction)) {
                    transactions.push(transaction.success);
                } else {
                    rowErrors.push(new ImportRowError({ reason: transaction.failure, rowColumns: Object.keys(row).join(',') }));
                }
            });
            yield* Effect.forEach(
                rowErrors,
                rowError => Effect.logError('row:process-error', { errorMessage: rowError.message, rowColumns: rowError.rowColumns }),
                { discard: true }
            );

            return { transactions, rowErrors };
        });

        return {
            replaceAll: Effect.fn('ImporterService.replaceAll')(function* (columnMap: ImporterColumnMapInterface, csvText: string) {
                yield* Effect.all(
                    [
                        accountRepository.truncate(),
                        categoryRepository.truncate(false),
                        transactionTagsRepository.truncate(),
                        transactionEntryRepository.truncate(),
                        transactionRepository.truncate(),
                        accountBalanceRepository.truncate()
                    ],
                    { discard: true }
                );

                const instrumentsMap = yield* initializeInstruments();
                const mccCategoryLookupMap = yield* loadMccCategoryLookupMap(mccCategoryRepository, settingsRepository);
                const { accountInputs, categoryInputs } = yield* collectEntities(csvText, columnMap, instrumentsMap);
                const accountsMap = yield* accountService.bulkCreate([...accountInputs.values()]);
                const categoriesMap = yield* categoryService.bulkCreate([...categoryInputs.values()]);
                const { transactions, rowErrors } = yield* processTransactions(csvText, {
                    columnMap,
                    instrumentsMap,
                    accountsMap,
                    categoriesMap,
                    mccCategoryLookupMap
                });
                const createdTransactions = yield* transactionService.bulkCreate(transactions);

                yield* accountBalanceIncrementalService.updateAllBalances(true);

                return {
                    transactionIds: createdTransactions.map(transaction => transaction.id),
                    transactions,
                    rowErrors
                } satisfies CsvImportResultInterface;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ImporterService, ImporterService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            CategoryRepository.layer,
            TransactionTagsRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            AccountBalanceRepository.layer,
            InstrumentRepository.layer,
            MccCategoryRepository.layer,
            SettingsRepository.layer,
            AccountService.layer,
            CategoryService.layer,
            TransactionService.layer,
            AccountBalanceIncrementalService.layer
        ])
    );
}
