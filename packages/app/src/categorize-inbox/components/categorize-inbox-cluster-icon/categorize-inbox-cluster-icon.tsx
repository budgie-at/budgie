import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'section' | 'rows'>;
}

const PRESENTATION = {
    cash: { icon: UserIconNameEnum.Banknote, variant: 'warning' },
    income: { icon: UserIconNameEnum.ArrowDownLeft, variant: 'positive' },
    expense: { icon: UserIconNameEnum.Store, variant: 'ghost' }
} as const;

export const CategorizeInboxClusterIcon = ({ cluster }: Props) => {
    const isCash = cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS;
    const isIncome = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME;

    const transactionKind = isIncome ? 'income' : 'expense';
    const { icon, variant } = isCash ? PRESENTATION.cash : PRESENTATION[transactionKind];

    return <CircleIcon icon={icon} variant={variant} size={40} iconSize={20} border={false} radius={14} />;
};
