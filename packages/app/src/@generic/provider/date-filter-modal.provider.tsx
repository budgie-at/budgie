import { ReactNode } from 'react';

import { DateFilterModalContext, DateFilterModalParams, DateFilterResult } from '../context/date-filter-modal.context';
import { useModalResolver } from '../hook/use-modal-resolver/use-modal-resolver.hook';

interface Props {
    readonly children: ReactNode;
}

export const DateFilterModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<DateFilterModalParams, DateFilterResult | null>('/date-filter');

    const value = { openDateFilter: open, resolveDateFilter: resolve, currentParams };

    return <DateFilterModalContext value={value}>{children}</DateFilterModalContext>;
};
