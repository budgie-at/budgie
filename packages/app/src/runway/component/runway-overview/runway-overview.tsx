import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { TransactionAnalyticsCard } from '../../../transaction/components/transaction-analytics-card/transaction-analytics-card';
import { getRunwayAmountVariant } from '../../utils/get-runway-amount-variant.util';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

export const RunwayOverview = ({ computation }: Props) => {
    const { t } = useLingui();
    const net = convertFromMicroUnits(computation.net);

    return (
        <View className="gap-y-lg">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Overview</Trans>
            </Text>

            <View className="flex-row gap-x-xl">
                <TransactionAnalyticsCard
                    amount={convertFromMicroUnits(computation.burn)}
                    label={t`Burn`}
                    icon={UserIconNameEnum.TrendingDown}
                    variant="destructive"
                />
                <TransactionAnalyticsCard
                    amount={convertFromMicroUnits(computation.income)}
                    label={t`Earn`}
                    icon={UserIconNameEnum.TrendingUp}
                    variant="positive"
                />
                <TransactionAnalyticsCard
                    amount={net}
                    label={t`Net`}
                    icon={UserIconNameEnum.Wallet}
                    variant={getRunwayAmountVariant(net)}
                />
            </View>
        </View>
    );
};
