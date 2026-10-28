import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetVerdictFigure = ({ scope, currencySymbol }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const isOver = scope.status === BudgetPaceStatusEnum.OVER;
    const figureAmount = isOver ? scope.spent - scope.limit : scope.safePerDay;
    const figure = formatDigits(convertFromMicroUnits(figureAmount), currencySymbol);

    return (
        <View className="flex-row items-baseline gap-x-sm">
            <ProtectedText
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.6}
                className="text-4xl font-bold tabular-nums text-primary"
            >
                {figure}
            </ProtectedText>
            <Text className="text-md font-medium text-secondary-foreground">{isOver ? <Trans>over</Trans> : <Trans>/ day</Trans>}</Text>
        </View>
    );
};
