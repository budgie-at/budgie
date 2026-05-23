/* eslint-disable no-await-in-loop */
import {
    AccountEntityInterface,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    MccCategoryEntityInterface,
    TransactionTypeEnum,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { format } from 'date-fns';
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
    private readonly BATCH_SIZE = 750;
    private readonly CSV_COLUMNS = [
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

    private accountsMap: AccountsMap = new Map();
    private deletedAccountsMap: AccountsMap = new Map();
    private categoriesMap: CategoriesMap = new Map();
    private instrumentsMap: InstrumentsMap = new Map();
    private mccCategoriesMap: MccCategoriesMap = new Map();

    async exportToCsv(): Promise<string> {
        const [accounts, deletedAccounts, categories, instruments, mccCategories] = await Promise.all([
            accountRepository.getAll(),
            accountRepository.getAllArchived(),
            categoryRepository.findAllNonSystem(),
            instrumentRepository.getAll(),
            mccCategoryRepository.findAll()
        ]);

        this.accountsMap = new Map(accounts.map(acc => [acc.id, acc]));
        this.deletedAccountsMap = new Map(deletedAccounts.map(acc => [acc.id, acc]));
        this.categoriesMap = new Map(categories.map(cat => [cat.id, cat]));
        this.instrumentsMap = new Map(instruments.map(inst => [inst.id, inst]));
        this.mccCategoriesMap = new Map(mccCategories.map(mccCategory => [mccCategory.id, mccCategory]));

        const rows = await this.processTransactionsInBatches();

        return Papa.unparse(rows, { header: true, columns: [...this.CSV_COLUMNS] });
    }

    async saveAndShare(): Promise<void> {
        const csvContent = await this.exportToCsv();
        const fileName = `budgie-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;

        const file = new File(Paths.cache, fileName);
        file.create();
        file.write(csvContent);

        const canShare = await isAvailableAsync();
        if (canShare) {
            await shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: fileName });
        }
    }

    // eslint-disable-next-line max-statements
    private async processTransactionsInBatches(): Promise<ExportRowInterface[]> {
        const rows: ExportRowInterface[] = [];
        let cursorId: number | null = null;

        do {
            const transactions = await transactionRepository.getAllAfter(cursorId, this.BATCH_SIZE);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            for (const transaction of transactions) {
                if (transaction.type === TransactionTypeEnum.TRANSFER) {
                    const fromAccountDeleted =
                        isDefined(transaction.fromAccountId) && this.deletedAccountsMap.has(transaction.fromAccountId);
                    const toAccountDeleted = isDefined(transaction.toAccountId) && this.deletedAccountsMap.has(transaction.toAccountId);

                    if (fromAccountDeleted && !toAccountDeleted) {
                        rows.push(this.mapDeletedFromAccountTransfer(transaction));
                    } else if (toAccountDeleted && !fromAccountDeleted) {
                        rows.push(this.mapDeletedToAccountTransfer(transaction));
                    } else if (!fromAccountDeleted && !toAccountDeleted) {
                        rows.push(this.mapTransferTransaction(transaction));
                    }
                } else if (isDefined(transaction.toAccountId) && !this.deletedAccountsMap.has(transaction.toAccountId)) {
                    rows.push(...this.mapIncomeExpenseTransaction(transaction));
                }
            }

            cursorId = transactions[transactions.length - 1].id;

            await microPause();
            // eslint-disable-next-line no-constant-condition,@typescript-eslint/no-unnecessary-condition
        } while (true);

        return rows;
    }

    private mapTransferTransaction(transaction: TransactionWithEntriesEntityInterface): ExportRowInterface {
        const entry = transaction.entries.at(0);

        const fromAccount = isDefined(transaction.fromAccountId) ? this.accountsMap.get(transaction.fromAccountId) : null;
        const toAccount = isDefined(transaction.toAccountId) ? this.accountsMap.get(transaction.toAccountId) : null;
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

    private mapDeletedFromAccountTransfer(transaction: TransactionWithEntriesEntityInterface): ExportRowInterface {
        const toAccount = isDefined(transaction.toAccountId) ? this.accountsMap.get(transaction.toAccountId) : null;
        const toInstrument = isDefined(toAccount?.instrumentId) ? this.instrumentsMap.get(toAccount.instrumentId) : null;
        const toEntry = transaction.entries.find(entry => entry.accountId === transaction.toAccountId);
        const category = isDefined(toEntry?.categoryId) ? this.categoriesMap.get(toEntry.categoryId) : null;
        const amount = isDefined(toEntry) ? toEntry.amount : 0;

        return this.createExportRow(transaction, toAccount, toInstrument, category, amount);
    }

    private mapDeletedToAccountTransfer(transaction: TransactionWithEntriesEntityInterface): ExportRowInterface {
        const fromAccount = isDefined(transaction.fromAccountId) ? this.accountsMap.get(transaction.fromAccountId) : null;
        const fromInstrument = isDefined(fromAccount?.instrumentId) ? this.instrumentsMap.get(fromAccount.instrumentId) : null;
        const fromEntry = transaction.entries.find(entry => entry.accountId === transaction.fromAccountId);
        const category = isDefined(fromEntry?.categoryId) ? this.categoriesMap.get(fromEntry.categoryId) : null;
        const amount = isDefined(fromEntry) ? -fromEntry.amount : 0;

        return this.createExportRow(transaction, fromAccount, fromInstrument, category, amount);
    }

    private mapIncomeExpenseTransaction(transaction: TransactionWithEntriesEntityInterface): ExportRowInterface[] {
        const toAccount = isDefined(transaction.toAccountId) ? this.accountsMap.get(transaction.toAccountId) : null;
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
