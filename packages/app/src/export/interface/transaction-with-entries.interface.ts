export interface TransactionWithEntriesInterface {
    externalId: string | null;
    comment: string;
    operatedAt: Date;
    toAccountId: number | null;
    fromAccountId: number | null;
    entries: Array<{ accountId: number; categoryId: number | null; amount: number }>;
}
