import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { StyleSheet, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BudgetCategoryForecast } from '../budget-category-forecast/budget-category-forecast';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly icon: UserIconType | null;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
    readonly onPress: () => void;
}

export const BudgetDetailsLimitCard = (props: Props) => {
    const { title, icon, scope, currencySymbol, testID, spentTestID, onPress } = props;
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();

    const remainingAmount = scope.limit - scope.spent;
    const remainingLabel = remainingAmount < 0 ? t`Over budget` : t`Left`;

    return (
        <View className="relative" collapsable={false}>
            <Card variant="ghost" size="md" onPress={onPress} className="gap-y-md">
                <View className="flex-row items-center gap-x-md">
                    {isDefined(icon) ? <CircleIcon icon={icon} variant="ghost" size={40} iconSize={18} /> : null}

                    <View className="flex-1 gap-y-xs">
                        <Text className="text-primary text-md font-semibold" numberOfLines={1}>
                            {title}
                        </Text>
                        <BudgetCategoryForecast scope={scope} currencySymbol={currencySymbol} />
                    </View>
                </View>

                <BudgetPaceTrack scope={scope} />

                <View className="flex-row justify-between gap-x-md">
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs">{t`Spent`}</Text>
                        <ProtectedText testID={spentTestID} className="text-primary text-sm font-semibold tabular-nums">
                            {formatDigits(convertFromMicroUnits(scope.spent), currencySymbol)}
                        </ProtectedText>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-secondary-foreground text-xs">{remainingLabel}</Text>
                        <ProtectedText className="text-primary text-sm font-semibold tabular-nums">
                            {formatDigits(convertFromMicroUnits(Math.abs(remainingAmount)), currencySymbol)}
                        </ProtectedText>
                    </View>
                    <View className="flex-1 items-end">
                        <Text className="text-secondary-foreground text-xs">{t`Limit`}</Text>
                        <ProtectedText className="text-primary text-sm font-semibold tabular-nums">
                            {formatDigits(convertFromMicroUnits(scope.limit), currencySymbol)}
                        </ProtectedText>
                    </View>
                </View>
            </Card>
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
