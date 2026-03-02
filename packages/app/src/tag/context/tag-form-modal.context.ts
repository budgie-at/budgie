import { TagEntityInterface } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { TagFormResult } from '../components/tag-form/tag-form';

export interface TagFormModalParams {
    readonly tag?: TagEntityInterface;
    readonly defaultTitle?: string;
}

export type TagFormModalResult = TagFormResult | null;

export const [TagFormModalContext, useTagFormModal] = createModalContext<TagFormModalParams, TagFormModalResult>(null);
