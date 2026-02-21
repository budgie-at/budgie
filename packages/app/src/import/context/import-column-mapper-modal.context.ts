import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

export interface ImportColumnMapperModalParams {
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly currentValue: string | undefined;
    readonly fieldLabel: string;
}

export type ImportColumnMapperResult = { readonly type: 'select'; readonly header: string } | { readonly type: 'clear' } | null;

interface ImportColumnMapperModalContextInterface {
    openImportColumnMapper: (params: ImportColumnMapperModalParams) => Promise<ImportColumnMapperResult>;
    resolveImportColumnMapper: (result: ImportColumnMapperResult) => void;
    currentParams: ImportColumnMapperModalParams | null;
}

export const ImportColumnMapperModalContext = createContext<ImportColumnMapperModalContextInterface>({
    openImportColumnMapper: () => Promise.resolve(null),
    resolveImportColumnMapper: emptyFn,
    currentParams: null
});

export const useImportColumnMapperModal = () => use(ImportColumnMapperModalContext);
