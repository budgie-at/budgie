import type { EmptyFn } from '@rnw-community/shared';

export interface ArchivedAccountActionsInterface {
    readonly isLoading: boolean;
    readonly restore: EmptyFn;
    readonly deleteAccount: EmptyFn;
}
