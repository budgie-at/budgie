import { TagEntityInterface } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { TagFormResult } from '../interface/tag-form-result.interface';

export interface TagFormModalParams {
    readonly tag?: TagEntityInterface;
    readonly defaultTitle?: string;
}

export type TagFormModalResult = TagFormResult | null;

export const [TagFormModalContext, useTagFormModal, useTagFormModalParams] = createModalContext<TagFormModalParams, TagFormModalResult>(
    null
);
