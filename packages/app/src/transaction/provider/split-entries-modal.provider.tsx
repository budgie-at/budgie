import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { SplitEntriesModalContext, SplitEntriesModalParams, SplitEntriesModalResult } from '../context/split-entries-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const SplitEntriesModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<SplitEntriesModalParams, SplitEntriesModalResult>('/split-entries');

    const value = { openSplitEntries: open, resolveSplitEntries: resolve, currentParams };

    return <SplitEntriesModalContext value={value}>{children}</SplitEntriesModalContext>;
};
