import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { TagsSelectorModalContext, TagsSelectorModalParams } from '../context/tags-selector-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const TagsSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<TagsSelectorModalParams, number[] | null>('/tags-selector');

    const value = { openTagsSelector: open, resolveTagsSelector: resolve, currentParams };

    return <TagsSelectorModalContext value={value}>{children}</TagsSelectorModalContext>;
};
