import type { TransactionAccountFilterCommitKindEnum } from '../enum/transaction-account-filter-commit-kind.enum';

export type TransactionAccountFilterCommitType =
    | { readonly kind: TransactionAccountFilterCommitKindEnum.APPLY; readonly value: number[] | null }
    | { readonly kind: TransactionAccountFilterCommitKindEnum.CREATE_ACCOUNT };
