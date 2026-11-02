import type { EmptyFn } from '@rnw-community/shared';

export interface HiddenAccountActionsInterface {
    readonly isLoading: boolean;
    readonly unhide: EmptyFn;
    readonly archive: EmptyFn;
}
