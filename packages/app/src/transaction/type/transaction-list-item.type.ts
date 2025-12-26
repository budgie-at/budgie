import { TransactionCardProps } from '../components/transaction-card/transaction-card';

export type TransactionListItemType =
    | { type: 'header'; title: string; id: string }
    | { type: 'transaction'; data: TransactionCardProps; id: string };
