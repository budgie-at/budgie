import {
    AccountEntityInterface,
    Db,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    MccCategoryEntityInterface,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { format } from 'date-fns/format';
import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import Papa from 'papaparse';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    accountRepository,
    categoryRepository,
    instrumentRepository,
    mccCategoryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { ExportRowInterface } from '../interface/export-row.interface';

type AccountsMap = Map<number, AccountEntityInterface>;
type CategoriesMap = Map<number, CategoryEntityInterface>;
type InstrumentsMap = Map<number, InstrumentEntityInterface>;
type MccCategoriesMap = Map<number, MccCategoryEntityInterface>;

class ExporterService {
    private static readonly BATCH_SIZE = 750;
    private static readonly CSV_COLUMNS = [
        'title',
        'externalId',
        'toAccount',
        'toAmount',
        'toCurrency',
        'fromAccount',
        'fromAmount',
        'fromCurrency',
        'category',
        'operatedAt',
        'comment',
        'mcc'
    ] as const;

    readonly exportToCsv = Effect.fn('ExporterService.exportToCsv')(function* (this: ExporterService) {
        const [accounts, deletedAccounts, categories, instruments, mccCategories] = yield* Effect.all(
            [
                accountRepository.getAll(),
                Db.query(() => accountRepository.getAllArchived()),
                Db.query(() => categoryRepository.findAllNonSystem()),
                instrumentRepository.getAll(),
                Db.query(() => mccCategoryRepository.findAll())
            ],
            { concurrency: 'unbounded' }
        );

        this.accountsMap = new Map(accounts.map(account => [account.id, account]));
        this.deletedAccountsMap = new Map(deletedAccounts.map(account => [account.id, account]));
        this.categoriesMap = new Map(categories.map(category => [category.id, category]));
        this.instrumentsMap = new Map(instruments.map(instrument => [instrument.id, instrument]));
        this.mccCategoriesMap = new Map(mccCategories.map(mccCategory => [mccCategory.id, mccCategory]));

        const rows = yield* this.processTransactionsInBatches();

        return Papa.unparse(rows, { header: true, columns: [...ExporterService.CSV_COLUMNS] });
    });

    readonly saveAndShare = Effect.fn('ExporterService.saveAndShare')(function* (this: ExporterService) {
        const csvContent = yield* this.exportToCsv();
        const fileName = `budgie-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;

        const file = new File(Paths.cache, fileName);
        file.create();
        file.write(csvContent);

        const canShare = yield* Effect.promise(() => isAvailableAsync());
        if (canShare) {
            yield* Effect.promise(() => shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: fileName }));
        }
    });

    private readonly processTransactionsInBatches = Effect.fn('ExporterService.processTransactionsInBatches')(
        function* (this: ExporterService) {
            const rows: ExportRowInterface[] = [];
            let transactions = yield* transactionRepository.getAllAfter(null, ExporterService.BATCH_SIZE);

            while (isNotEmptyArray(transactions)) {
                for (const transaction of transactions) {
                    if (transaction.type === TransactionTypeEnum.TRANSFER) {
                        rows.push(this.mapTransferTransaction(transaction));
                    } else if (isDefined(transaction.toAccountId)) {
                        rows.push(...this.mapIncomeExpenseTransaction(transaction));
                    }
                }

                yield* Effect.promise(() => microPause());
                transactions = yield* transactionRepository.getAllAfter(
                    transactions[transactions.length - 1].id,
                    ExporterService.BATCH_SIZE
                );
            }

            return rows;
        }
    );

    private accountsMap: AccountsMap = new Map();
    private deletedAccountsMap: AccountsMap = new Map();
    private categoriesMap: CategoriesMap = new Map();
    private instrumentsMap: InstrumentsMap = new Map();
    private mccCategoriesMap: MccCategoriesMap = new Map();

    private getAccount(accountId: number | null | undefined): AccountEntityInterface | null {
        if (!isDefined(accountId)) {
            return null;
        }

        return this.accountsMap.get(accountId) ?? this.deletedAccountsMap.get(accountId) ?? null;
    }

    private mapTransferTransaction(transaction: TransactionWithEntriesEntityInterface): ExportRowInterface {
        const entry = transaction.entries.at(0);

        const fromAccount = this.getAccount(transaction.fromAccountId);
        const toAccount = this.getAccount(transaction.toAccountId);
        const fromInstrument = isDefined(fromAccount?.instrumentId) ? this.instrumentsMap.get(fromAccount.instrumentId) : null;
        const toInstrument = isDefined(toAccount?.instrumentId) ? this.instrumentsMap.get(toAccount.instrumentId) : null;
        const category = isDefined(entry?.categoryId) ? this.categoriesMap.get(entry.categoryId) : null;

        const fromEntry = transaction.entries.find(entry => entry.accountId === transaction.fromAccountId);
        const toEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);

        return {
            title: transaction.title,
            externalId: transaction.externalId ?? '',
            fromAccount: toAccount?.title ?? '',
            fromAmount: isDefined(toEntry) ? String(convertFromMicroUnits(toEntry.amount)) : '',
            fromCurrency: toInstrument?.code ?? '',
            toAccount: fromAccount?.title ?? '',
            toAmount: isDefined(fromEntry) ? String(convertFromMicroUnits(fromEntry.amount)) : '',
            toCurrency: fromInstrument?.code ?? '',
            category: category?.title ?? '',
            operatedAt: format(transaction.operatedAt, 'MM/dd/yyyy HH:mm:ss'),
            comment: transaction.comment,
            mcc: ''
        };
    }

    private mapIncomeExpenseTransaction(transaction: TransactionWithEntriesEntityInterface): ExportRowInterface[] {
        const toAccount = this.getAccount(transaction.toAccountId);
        const toInstrument = isDefined(toAccount?.instrumentId) ? this.instrumentsMap.get(toAccount.instrumentId) : null;

        return transaction.entries.map(entry => {
            const category = isDefined(entry.categoryId) ? this.categoriesMap.get(entry.categoryId) : null;
            const signedAmount = transaction.type === TransactionTypeEnum.EXPENSE ? -entry.amount : entry.amount;
            const mcc = isDefined(entry.mccCategoryId) ? (this.mccCategoriesMap.get(entry.mccCategoryId)?.mcc ?? '') : '';
            const row = this.createExportRow(transaction, toAccount, toInstrument, category, signedAmount);

            return { ...row, mcc };
        });
    }

    // eslint-disable-next-line @typescript-eslint/max-params
    private createExportRow(
        transaction: TransactionWithEntriesEntityInterface,
        account: AccountEntityInterface | null | undefined,
        instrument: InstrumentEntityInterface | null | undefined,
        category: CategoryEntityInterface | null | undefined,
        amount: number
    ): ExportRowInterface {
        return {
            title: transaction.title,
            externalId: transaction.externalId ?? '',
            toAccount: account?.title ?? '',
            toAmount: String(convertFromMicroUnits(amount)),
            toCurrency: instrument?.code ?? '',
            fromAccount: '',
            fromAmount: '',
            fromCurrency: '',
            category: category?.title ?? '',
            operatedAt: format(transaction.operatedAt, 'MM/dd/yyyy HH:mm:ss'),
            comment: transaction.comment,
            mcc: ''
        };
    }
}

export const exporterService = new ExporterService();
