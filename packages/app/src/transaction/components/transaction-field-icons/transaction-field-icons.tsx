import { ReactNode } from 'react';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

interface Props {
    readonly children: ReactNode;
}

export const TransactionFieldIcons = ({ children }: Props) => <GroupedListSection>{children}</GroupedListSection>;
