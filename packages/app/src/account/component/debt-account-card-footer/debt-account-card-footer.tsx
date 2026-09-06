import { Text, View } from 'react-native';

import { useDebtAccountCard } from '../../context/debt-account-card.context';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

import { DebtAccountCardFooterSelector } from './debt-account-card-footer.selector';

export const DebtAccountCardFooter = () => {
    const { displayPercentage, settledLabel, title } = useDebtAccountCard();

    return (
        <View className="gap-y-sm">
            <Text
                className="text-secondary-foreground text-xxs tabular-nums"
                numberOfLines={1}
                testID={DebtAccountCardFooterSelector.Percentage(title, displayPercentage)}
            >
                {`${settledLabel} · ${displayPercentage}%`}
            </Text>

            <DebtProgressTrack percentage={displayPercentage} className="h-1.5" />
        </View>
    );
};
