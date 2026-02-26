import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TagsSelectorModalParams {
    readonly initialTagIds?: number[];
    readonly excludeTagIds?: number[];
    readonly description?: string;
    readonly singleSelect?: boolean;
}

export type TagsSelectorResult = number[] | null;

export const [TagsSelectorModalContext, useTagsSelectorModal] = createModalContext<TagsSelectorModalParams, TagsSelectorResult>(null);
