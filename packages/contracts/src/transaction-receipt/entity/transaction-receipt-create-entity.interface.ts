import type { TransactionReceiptEntityInterface } from './transaction-receipt-entity.interface';

export type TransactionReceiptCreateEntityInterface = Pick<
    TransactionReceiptEntityInterface,
    'transactionId' | 'fingerprint' | 'receiptNumber' | 'merchantVatId' | 'merchantLegalName'
>;
