import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetIncomeStatusInterface } from '../../interface/budget-calculation-result.interface';

interface Props {
    readonly incomeStatuses: readonly BudgetIncomeStatusInterface[];
    readonly totalActual: number;
    readonly totalExpected: number;
}

const getIncomeDisplayName = (income: BudgetIncomeStatusInterface, deletedLabel: string, unknownLabel: string): string => {
    if (income.isCategoryDeleted) {
        return deletedLabel;
    }

    return isNotEmptyString(income.categoryName) ? income.categoryName : unknownLabel;
};

export const BudgetIncomeCard = ({ incomeStatuses, totalActual, totalExpected }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    const handleAddIncome = () => void router.push('/budget/income-expectations');

    return (
        <Card>
            <View className="flex-row items-center justify-between mb-md">
                <Text className="text-primary font-medium">
                    <Trans>Income</Trans>
                </Text>
                <HapticPressable onPress={handleAddIncome} className="p-sm">
                    <Icon icon={UserIconNameEnum.Plus} size={20} className="text-secondary-foreground" />
                </HapticPressable>
            </View>
            {incomeStatuses.map(income => {
                const displayName = getIncomeDisplayName(income, t`Deleted category`, t`Unknown`);
                const nameClassName = income.isCategoryDeleted ? 'text-destructive-foreground italic' : 'text-primary';

                return (
                    <View key={income.categoryId} className="flex-row justify-between py-sm">
                        <Text className={nameClassName}>{displayName}</Text>
                        <Text className="text-secondary-foreground">
                            {formatMoney(income.actual, symbol)} / {formatMoney(income.expected, symbol)}
                        </Text>
                    </View>
                );
            })}
            <View className="flex-row justify-between pt-md mt-md border-t border-secondary-corner">
                <Text className="text-primary font-medium">
                    <Trans>Total</Trans>
                </Text>
                <Text className="text-primary font-medium">
                    {formatMoney(totalActual, symbol)} / {formatMoney(totalExpected, symbol)}
                </Text>
            </View>
        </Card>
    );
};
