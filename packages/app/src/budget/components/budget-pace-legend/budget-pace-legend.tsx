import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BUDGET_PACE_FILL_CLASS_NAME } from '../../constant/budget-pace-fill-class-name.constant';
import { BUDGET_PACE_RESERVED_CLASS_NAME } from '../../constant/budget-pace-reserved-class-name.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { BudgetPaceLegendItem } from '../budget-pace-legend-item/budget-pace-legend-item';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetPaceLegend = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const variant = BUDGET_PACE_VARIANT[scope.status];

    return (
        <View className="flex-row gap-x-md">
            <BudgetPaceLegendItem
                label={t`Spent`}
                amount={formatDigits(convertFromMicroUnits(scope.spent), currencySymbol)}
                swatchClassName={BUDGET_PACE_FILL_CLASS_NAME[variant]}
            />
            <BudgetPaceLegendItem
                label={t`Upcoming`}
                amount={formatDigits(convertFromMicroUnits(scope.upcoming), currencySymbol)}
                swatchClassName={BUDGET_PACE_RESERVED_CLASS_NAME[variant]}
            />
            <BudgetPaceLegendItem
                label={t`Limit`}
                amount={formatDigits(convertFromMicroUnits(scope.limit), currencySymbol)}
                swatchClassName="bg-secondary-corner"
            />
        </View>
    );
};
