import { TransactionCardPureProps } from '../components/transaction-card/transaction-card';

export type TransactionListItemType =
    | { type: 'header'; title: string; id: string }
    | { type: 'transaction'; data: TransactionCardPureProps; id: string };
