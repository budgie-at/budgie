/* eslint-disable no-await-in-loop */
import {
    AccountEntityInterface,
    CategoryEntityInterface,
    InstrumentEntityInterface,
    TransactionEntityInterface,
    TransactionEntryEntityInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import { format } from 'date-fns';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import Papa from 'papaparse';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, categoryRepository, instrumentRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { ExportRowInterface } from '../interface/export-row.interface';

type AccountsMap = Map<number, AccountEntityInterface>;
type CategoriesMap = Map<number, CategoryEntityInterface>;
type InstrumentsMap = Map<number, InstrumentEntityInterface>;

type TransactionWithEntries = TransactionEntityInterface & { entries: TransactionEntryEntityInterface[] };

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
        'comment'
    ] as const;

    async exportToCsv(): Promise<string> {
        const [accounts, deletedAccounts, categories, instruments] = await Promise.all([
            accountRepository.getAll(),
            accountRepository.getAllArchived(),
            categoryRepository.findAll(),
            instrumentRepository.getAll()
        ]);

        const accountsMap: AccountsMap = new Map([...deletedAccounts, ...accounts].map(acc => [acc.id, acc]));
        const categoriesMap: CategoriesMap = new Map(categories.map(cat => [cat.id, cat]));
        const instrumentsMap: InstrumentsMap = new Map(instruments.map(inst => [inst.id, inst]));

        const rows = await this.processTransactionsInBatches(accountsMap, categoriesMap, instrumentsMap);

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
    private async processTransactionsInBatches(
        accountsMap: AccountsMap,
        categoriesMap: CategoriesMap,
        instrumentsMap: InstrumentsMap
    ): Promise<ExportRowInterface[]> {
        const rows: ExportRowInterface[] = [];
        let offset = 0;

        do {
            const transactions = await transactionRepository.getAllWithOffset(this.BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            for (const transaction of transactions) {
                const entry = transaction.entries.at(0);
                if (isDefined(entry)) {
                    const category = isDefined(entry.categoryId) ? categoriesMap.get(entry.categoryId) : null;

                    if (transaction.type === TransactionTypeEnum.TRANSFER) {
                        rows.push(this.mapTransferTransaction(transaction, accountsMap, instrumentsMap, category));
                    } else {
                        rows.push(...this.mapIncomeExpenseTransaction(transaction, accountsMap, instrumentsMap, category));
                    }
                }
            }

            offset += this.BATCH_SIZE;

            await microPause();
            // eslint-disable-next-line no-constant-condition,@typescript-eslint/no-unnecessary-condition
        } while (true);

        return rows;
    }

    private mapTransferTransaction(
        transaction: TransactionWithEntries,
        accountsMap: AccountsMap,
        instrumentsMap: InstrumentsMap,
        category: CategoryEntityInterface | null | undefined
    ): ExportRowInterface {
        const fromAccount = isDefined(transaction.fromAccountId) ? accountsMap.get(transaction.fromAccountId) : null;
        const toAccount = isDefined(transaction.toAccountId) ? accountsMap.get(transaction.toAccountId) : null;
        const fromInstrument = isDefined(fromAccount?.instrumentId) ? instrumentsMap.get(fromAccount.instrumentId) : null;
        const toInstrument = isDefined(toAccount?.instrumentId) ? instrumentsMap.get(toAccount.instrumentId) : null;

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
            comment: transaction.comment
        };
    }

    private mapIncomeExpenseTransaction(
        transaction: TransactionWithEntries,
        accountsMap: AccountsMap,
        instrumentsMap: InstrumentsMap,
        category: CategoryEntityInterface | null | undefined
    ): ExportRowInterface[] {
        const toAccount = isDefined(transaction.toAccountId) ? accountsMap.get(transaction.toAccountId) : null;
        const toInstrument = isDefined(toAccount?.instrumentId) ? instrumentsMap.get(toAccount.instrumentId) : null;

        const rows: ExportRowInterface[] = [];
        for (const entry of transaction.entries) {
            const amount = isDefined(entry) ? convertFromMicroUnits(entry.amount) : 0;
            const signedAmount = transaction.type === TransactionTypeEnum.EXPENSE ? -amount : amount;

            rows.push({
                title: transaction.title,
                externalId: transaction.externalId ?? '',
                toAccount: toAccount?.title ?? '',
                toAmount: String(signedAmount),
                toCurrency: toInstrument?.code ?? '',
                fromAccount: '',
                fromAmount: '',
                fromCurrency: '',
                category: category?.title ?? '',
                operatedAt: format(transaction.operatedAt, 'MM/dd/yyyy HH:mm:ss'),
                comment: transaction.comment
            });
        }

        return rows;
    }
}

export const exporterService = new ExporterService();
