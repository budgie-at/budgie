import { Text, View } from 'react-native';

import { useDebtAccountCard } from '../../context/debt-account-card.context';
import { DebtAccountCardFooterSelector } from '../debt-account-card-footer/debt-account-card-footer.selector';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

export const DebtAccountCardPercentageFooter = () => {
    const { displayPercentage, settledLabel, title } = useDebtAccountCard();

    return (
        <View className="gap-y-sm">
            <View className="flex-row flex-wrap items-center gap-x-sm gap-y-xxs">
                <View className="rounded-full border border-secondary-corner bg-secondary-background px-sm py-[2px]">
                    <Text
                        className="text-primary text-xxs font-semibold tabular-nums"
                        testID={DebtAccountCardFooterSelector.Percentage(title, displayPercentage)}
                    >
                        {`${displayPercentage}%`}
                    </Text>
                </View>

                <Text className="text-secondary-foreground text-xxs shrink" numberOfLines={1}>
                    {settledLabel}
                </Text>
            </View>

            <DebtProgressTrack percentage={displayPercentage} className="h-1.5" />
        </View>
    );
};
