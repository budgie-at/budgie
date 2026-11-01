import { TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Plural } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { getCategorizeInboxClusterTotal } from '../../utils/get-categorize-inbox-cluster-total.util';
import { hasCategorizeInboxMonthlyVariation } from '../../utils/has-categorize-inbox-monthly-variation.util';
import { hasCategorizeInboxUniformAmounts } from '../../utils/has-categorize-inbox-uniform-amounts.util';
import { CategorizeInboxGroupFinding } from '../categorize-inbox-group-finding/categorize-inbox-group-finding';
import { CategorizeInboxGroupScreenSelector } from '../categorize-inbox-group-screen/categorize-inbox-group-screen.selector';
import { CategorizeInboxGroupStatsLine } from '../categorize-inbox-group-stats-line/categorize-inbox-group-stats-line';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupHero = ({ cluster }: Props) => {
    const protectAmount = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { amount, symbol, sign } = getCategorizeInboxClusterTotal(cluster, defaultInstrument.symbol);
    const isAverageShown = !hasCategorizeInboxUniformAmounts(cluster.rows) && !hasCategorizeInboxMonthlyVariation(cluster.rows);
    const amountColorClassName = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME ? 'text-positive-foreground' : 'text-primary';
    const averageLine = isAverageShown ? <CategorizeInboxGroupStatsLine cluster={cluster} /> : null;

    return (
        <View className="items-center gap-y-sm px-3xl pb-xs pt-md">
            <View className="items-center gap-y-md self-stretch">
                <Text
                    className="text-primary text-center text-[20px] leading-[26px] font-semibold"
                    accessibilityRole="header"
                    {...testID(CategorizeInboxGroupScreenSelector.Title)}
                >
                    {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                </Text>
                <Text
                    className={cn('text-[40px] leading-[48px] font-semibold tracking-[-1px] tabular-nums', amountColorClassName)}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                >
                    {`${sign}${protectAmount(amount, symbol)}`}
                </Text>
            </View>
            <Text className="text-secondary-foreground text-center text-[15px] leading-[20px]" numberOfLines={1}>
                <Plural value={cluster.rows.length} one="# payment" other="# payments" />
                {' · '}
                <CategorizeInboxGroupFinding cluster={cluster} />
            </Text>
            {averageLine}
        </View>
    );
};
