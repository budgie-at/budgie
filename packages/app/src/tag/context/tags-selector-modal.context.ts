import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface TagsSelectorModalParams {
    readonly initialTagIds?: number[];
}

interface TagsSelectorModalContextInterface {
    openTagsSelector: (params?: TagsSelectorModalParams) => Promise<number[] | null>;
    resolveTagsSelector: (tagIds: number[] | null) => void;
    currentParams: TagsSelectorModalParams | null;
}

export const TagsSelectorModalContext = createContext<TagsSelectorModalContextInterface>({
    openTagsSelector: () => Promise.resolve(null),
    resolveTagsSelector: emptyFn,
    currentParams: null
});

export const useTagsSelectorModal = () => use(TagsSelectorModalContext);
