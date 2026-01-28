import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { TagFormResult } from '../components/tag-form/tag-form';
import { TagFormModalContext, TagFormModalParams } from '../context/tag-form-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TagFormModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<TagFormModalParams, TagFormResult | null>('/tag-form');

    const value = { openTagForm: open, resolveTagForm: resolve, currentParams };

    return <TagFormModalContext value={value}>{children}</TagFormModalContext>;
};
