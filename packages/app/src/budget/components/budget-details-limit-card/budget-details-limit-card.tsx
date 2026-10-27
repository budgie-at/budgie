import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { StyleSheet, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly icon: UserIconType | null;
    readonly spent: number;
    readonly limitAmount: number;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
    readonly onPress: () => void;
}

export const BudgetDetailsLimitCard = (props: Props) => {
    const { title, icon, spent, limitAmount, currencySymbol, testID, spentTestID, onPress } = props;
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const { t } = useLingui();

    const remainingAmount = limitAmount - spent;
    const remainingLabel = remainingAmount < 0 ? t`Over budget` : t`Left`;

    return (
        <View className="relative" collapsable={false}>
            <Card variant="ghost" size="md" onPress={onPress} className="gap-y-md">
                <View className="flex-row items-center gap-x-md">
                    {isDefined(icon) ? <CircleIcon icon={icon} variant="ghost" size={40} iconSize={18} /> : null}

                    <Text className="text-primary text-md font-semibold flex-1" numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                <BudgetProgressBar isSummaryVisible={false} spent={spent} limit={limitAmount} />

                <View className="flex-row justify-between gap-x-md">
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs">{t`Spent`}</Text>
                        <Text testID={spentTestID} className="text-primary text-sm font-semibold">
                            {formatDigits(convertFromMicroUnits(spent), currencySymbol)}
                        </Text>
                    </View>
                    <View className="flex-1 items-center">
                        <Text className="text-secondary-foreground text-xs">{remainingLabel}</Text>
                        <Text className="text-primary text-sm font-semibold">
                            {formatDigits(convertFromMicroUnits(Math.abs(remainingAmount)), currencySymbol)}
                        </Text>
                    </View>
                    <View className="flex-1 items-end">
                        <Text className="text-secondary-foreground text-xs">{t`Limit`}</Text>
                        <Text className="text-primary text-sm font-semibold">
                            {formatDigits(convertFromMicroUnits(limitAmount), currencySymbol)}
                        </Text>
                    </View>
                </View>
            </Card>
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
