import { TagEntityInterface } from '@budgie/contracts';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { TagFormResult } from '../components/tag-form/tag-form';

export interface TagFormModalParams {
    readonly tag?: TagEntityInterface;
    readonly defaultTitle?: string;
}

interface TagFormModalContextInterface {
    openTagForm: (params?: TagFormModalParams) => Promise<TagFormResult | null>;
    resolveTagForm: (result: TagFormResult | null) => void;
    currentParams: TagFormModalParams | null;
}

export const TagFormModalContext = createContext<TagFormModalContextInterface>({
    openTagForm: () => Promise.resolve(null),
    resolveTagForm: emptyFn,
    currentParams: null
});

export const useTagFormModal = () => use(TagFormModalContext);
