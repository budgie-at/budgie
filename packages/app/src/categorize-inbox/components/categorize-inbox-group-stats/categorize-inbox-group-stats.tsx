import { TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { CategorizeInboxGroupStat } from '../categorize-inbox-group-stat/categorize-inbox-group-stat';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupStats = ({ cluster }: Props) => {
    const { t } = useLingui();
    const protectAmount = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const count = cluster.rows.length;
    const hasBaseTotal = isDefined(cluster.totalBaseAmount);
    const fallbackTotal = cluster.rows.reduce((sum, row) => sum + row.amount, 0);
    const total = cluster.totalBaseAmount ?? fallbackTotal;
    const symbol = hasBaseTotal ? defaultInstrument.symbol : (cluster.rows.at(0)?.instrumentSymbol ?? '');
    const sign = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME ? '+' : '';
    const totalLabel = `${sign}${protectAmount(total, symbol)}`;
    const averageLabel = `${sign}${protectAmount(total / Math.max(1, count), symbol)}`;

    return (
        <View className="flex-row items-start">
            <CategorizeInboxGroupStat value={String(count)} label={t`payments`} className="items-start" />
            <CategorizeInboxGroupStat value={totalLabel} label={t`total`} className="items-center" />
            <CategorizeInboxGroupStat value={averageLabel} label={t`average`} className="items-end" />
        </View>
    );
};
