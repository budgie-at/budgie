/* eslint-disable no-await-in-loop */
import { AccountEntityInterface, CategoryEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';
import { format } from 'date-fns';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import Papa from 'papaparse';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, categoryRepository, instrumentRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { ExportRowInterface } from '../interface/export-row.interface';
import { TransactionWithEntriesInterface } from '../interface/transaction-with-entries.interface';

type AccountsMap = Map<number, AccountEntityInterface>;
type CategoriesMap = Map<number, CategoryEntityInterface>;
type InstrumentsMap = Map<number, InstrumentEntityInterface>;

class ExporterService {
    private readonly BATCH_SIZE = 750;
    private readonly CSV_COLUMNS = [
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
        const [accounts, categories, instruments] = await Promise.all([
            accountRepository.getAll(),
            categoryRepository.findAll(),
            instrumentRepository.getAll()
        ]);

        const accountsMap: AccountsMap = new Map(accounts.map(acc => [acc.id, acc]));
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

    private async processTransactionsInBatches(
        accountsMap: AccountsMap,
        categoriesMap: CategoriesMap,
        instrumentsMap: InstrumentsMap
    ): Promise<ExportRowInterface[]> {
        const rows: ExportRowInterface[] = [];
        let offset = 0;

        do {
            const transactions = await transactionRepository.getAllWithOffset(this.BATCH_SIZE, offset);

            if (transactions.length === 0) {
                break;
            }

            for (const transaction of transactions) {
                rows.push(this.mapTransactionToRow(transaction, accountsMap, categoriesMap, instrumentsMap));
            }

            offset += this.BATCH_SIZE;

            await microPause();
            // eslint-disable-next-line no-constant-condition,@typescript-eslint/no-unnecessary-condition
        } while (true);

        return rows;
    }

    private mapTransactionToRow(
        transaction: TransactionWithEntriesInterface,
        accountsMap: AccountsMap,
        categoriesMap: CategoriesMap,
        instrumentsMap: InstrumentsMap
    ): ExportRowInterface {
        const toAccount = isDefined(transaction.toAccountId) ? accountsMap.get(transaction.toAccountId) : null;
        const fromAccount = isDefined(transaction.fromAccountId) ? accountsMap.get(transaction.fromAccountId) : null;
        const toInstrument = isDefined(toAccount?.instrumentId) ? instrumentsMap.get(toAccount.instrumentId) : null;
        const fromInstrument = isDefined(fromAccount?.instrumentId) ? instrumentsMap.get(fromAccount.instrumentId) : null;

        const entry = transaction.entries.at(0);
        const category = isDefined(entry?.categoryId) ? categoriesMap.get(entry.categoryId) : null;
        const toEntry = transaction.entries.find(ent => ent.accountId === transaction.toAccountId);
        const fromEntry = transaction.entries.find(ent => ent.accountId === transaction.fromAccountId);

        return {
            externalId: transaction.externalId ?? '',
            toAccount: toAccount?.title ?? '',
            toAmount: isDefined(toEntry) ? String(toEntry.amount / 100) : '',
            toCurrency: toInstrument?.code ?? '',
            fromAccount: fromAccount?.title ?? '',
            fromAmount: isDefined(fromEntry) ? String(fromEntry.amount / 100) : '',
            fromCurrency: fromInstrument?.code ?? '',
            category: category?.title ?? '',
            operatedAt: format(transaction.operatedAt, 'MM/dd/yyyy HH:mm:ss'),
            comment: transaction.comment
        };
    }
}

export const exporterService = new ExporterService();
