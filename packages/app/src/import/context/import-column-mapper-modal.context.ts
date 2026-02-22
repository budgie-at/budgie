import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface ImportColumnMapperModalParams {
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly currentValue: string | undefined;
    readonly fieldLabel: string;
}

export type ImportColumnMapperResult = { readonly type: 'select'; readonly header: string } | { readonly type: 'clear' } | null;

export const [ImportColumnMapperModalContext, useImportColumnMapperModal] = createModalContext<
    ImportColumnMapperModalParams,
    ImportColumnMapperResult
>(null);
