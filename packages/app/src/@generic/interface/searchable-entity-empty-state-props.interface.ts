import type { EmptyFn } from '@rnw-community/shared';

export interface SearchableEntityEmptyStatePropsInterface {
    readonly search: string;
    readonly onClearSearch: EmptyFn;
    readonly onCreate: (defaultTitle: string) => void;
}
