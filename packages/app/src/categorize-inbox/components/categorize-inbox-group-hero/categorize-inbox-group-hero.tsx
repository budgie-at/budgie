import { TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Plural } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxClusterTotal } from '../../utils/get-categorize-inbox-cluster-total.util';
import { hasCategorizeInboxMonthlyVariation } from '../../utils/has-categorize-inbox-monthly-variation.util';
import { CategorizeInboxGroupFinding } from '../categorize-inbox-group-finding/categorize-inbox-group-finding';
import { CategorizeInboxGroupStatsLine } from '../categorize-inbox-group-stats-line/categorize-inbox-group-stats-line';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupHero = ({ cluster }: Props) => {
    const protectAmount = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { amount, symbol, sign } = getCategorizeInboxClusterTotal(cluster, defaultInstrument.symbol);
    const isAverageShown = cluster.rows.length > 1 && !hasCategorizeInboxMonthlyVariation(cluster.rows);
    const amountColorClassName = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME ? 'text-positive-foreground' : 'text-primary';
    const averageLine = isAverageShown ? <CategorizeInboxGroupStatsLine cluster={cluster} /> : null;

    return (
        <View className="items-center gap-y-sm px-3xl pb-xs pt-md">
            <Text
                className={cn('text-[40px] leading-[48px] font-semibold tracking-[-1px] tabular-nums', amountColorClassName)}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
            >
                {`${sign}${protectAmount(amount, symbol)}`}
            </Text>
            <Text className="text-secondary-foreground text-center text-[15px] leading-[20px]" numberOfLines={1}>
                <Plural value={cluster.rows.length} one="# payment" other="# payments" />
                {' · '}
                <CategorizeInboxGroupFinding cluster={cluster} />
            </Text>
            {averageLine}
        </View>
    );
};
