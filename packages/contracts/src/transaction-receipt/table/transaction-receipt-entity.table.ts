import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

export const TransactionReceiptEntityTable = sqliteTable(
    'transaction_receipts',
    {
        transactionId: int('transaction_id', { mode: 'number' })
            .primaryKey()
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' }),
        fingerprint: text('fingerprint').notNull(),
        receiptNumber: text('receipt_number'),
        merchantVatId: text('merchant_vat_id'),
        merchantLegalName: text('merchant_legal_name'),
        scannedAt: int('scanned_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP)
    },
    table => [uniqueIndex('transaction_receipts_fingerprint_idx').on(table.fingerprint)]
);
