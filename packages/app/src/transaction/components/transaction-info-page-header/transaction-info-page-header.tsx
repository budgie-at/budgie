import { PageHeader } from '../../../@generic/component/page-header/page-header';

import type { EmptyFn } from '@rnw-community/shared';
import type { ReactNode } from 'react';

interface Props {
    readonly actionsMenu: ReactNode;
    readonly onGoBack: EmptyFn;
}

export const TransactionInfoPageHeader = ({ actionsMenu, onGoBack }: Props) => (
    <PageHeader title="" size="md" onGoBack={onGoBack} right={actionsMenu} />
);
