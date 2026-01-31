import { ReactNode } from 'react';

import { IconSelectorModalContext, IconSelectorModalParams, IconSelectorResult } from '../context/icon-selector-modal.context';
import { useModalResolver } from '../hook/use-modal-resolver/use-modal-resolver.hook';

interface Props {
    readonly children: ReactNode;
}

export const IconSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<IconSelectorModalParams, IconSelectorResult>('/icon-selector');

    const value = { openIconSelector: open, resolveIconSelector: resolve, currentParams };

    return <IconSelectorModalContext value={value}>{children}</IconSelectorModalContext>;
};
