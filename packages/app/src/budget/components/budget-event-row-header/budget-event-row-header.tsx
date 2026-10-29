import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetEventProjectionInterface } from '../../interface/budget-event-projection.interface';

interface Props {
    readonly event: BudgetEventProjectionInterface;
}

export const BudgetEventRowHeader = ({ event }: Props) => {
    const { budget, projection } = event;
    const formatDigits = useFormatDigits(0);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const spentLabel = formatDigits(convertFromMicroUnits(projection.overall.spent), currencySymbol);
    const limitLabel = formatDigits(convertFromMicroUnits(projection.overall.limit), currencySymbol);

    return (
        <View className="flex-row items-baseline justify-between gap-x-md">
            <Text numberOfLines={1} className="shrink text-sm font-medium text-primary">
                {budget.name}
            </Text>
            <View className="flex-row items-baseline gap-x-xs">
                <ProtectedText
                    testID={BudgetSelector.DetailsEventSpentLabel(budget.id)}
                    className="text-sm font-semibold tabular-nums text-primary"
                >
                    {spentLabel}
                </ProtectedText>
                <ProtectedText className="text-sm tabular-nums text-secondary-foreground">/ {limitLabel}</ProtectedText>
            </View>
        </View>
    );
};
