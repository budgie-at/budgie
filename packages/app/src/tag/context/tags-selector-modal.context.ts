import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface TagsSelectorModalParams {
    readonly initialTagIds?: number[];
    readonly suggestedTagIds?: number[];
    readonly excludeTagIds?: number[];
    readonly title?: string;
    readonly description?: string;
    readonly singleSelect?: boolean;
    readonly enablePrimarySelection?: boolean;
    readonly commitLabel?: string;
    readonly getCommitSummary?: (destinationTitle: string) => string;
}

export type TagsSelectorResult = number[] | null;

export const [TagsSelectorModalContext, useTagsSelectorModal, useTagsSelectorModalParams] = createModalContext<
    TagsSelectorModalParams,
    TagsSelectorResult
>(null);
