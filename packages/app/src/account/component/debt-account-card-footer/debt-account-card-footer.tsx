import { Text, View } from 'react-native';

import { useDebtAccountCard } from '../../context/debt-account-card.context';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

import { DebtAccountCardFooterSelector } from './debt-account-card-footer.selector';

export const DebtAccountCardFooter = () => {
    const { displayPercentage, settledLabel, title } = useDebtAccountCard();

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-baseline justify-between gap-x-sm">
                <Text className="shrink text-secondary-foreground text-xxs" numberOfLines={2}>
                    {settledLabel}
                </Text>

                <Text
                    className="text-secondary-foreground text-xxs font-medium tabular-nums"
                    testID={DebtAccountCardFooterSelector.Percentage(title, displayPercentage)}
                >
                    {`${displayPercentage}%`}
                </Text>
            </View>

            <DebtProgressTrack percentage={displayPercentage} className="h-1.5" />
        </View>
    );
};
