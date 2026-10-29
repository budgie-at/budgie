import { BudgetKindEnum, BudgetLimitSourceEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { useGetBudgetExpectedIncomeQuery } from '../../query/use-get-budget-expected-income.query';
import { toBudgetProjectionKey } from '../../utils/to-budget-projection-key.util';

export const BudgetExpectedIncomeHint = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const [period, periodStartDay, useLastDayOfMonth, periodAnchorMs, instrumentId] = useWatch({
        control,
        name: ['period', 'periodStartDay', 'useLastDayOfMonth', 'periodAnchorMs', 'instrumentId']
    });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const formatDigits = useDisplayFormatDigits();
    const projectionKey = toBudgetProjectionKey(
        {
            id: 0,
            kind: BudgetKindEnum.MAIN,
            period,
            periodStartDay,
            useLastDayOfMonth,
            periodAnchorDate: isDefined(periodAnchorMs) ? new Date(periodAnchorMs) : null,
            startsAt: null,
            endsAt: null,
            limitSource: BudgetLimitSourceEnum.INCOME_EXPECTED,
            instrumentId,
            overallLimit: 0,
            otherLimit: 0,
            tagId: null
        },
        0
    );
    const expectedIncome = useGetBudgetExpectedIncomeQuery(projectionKey);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const hasExpectedIncome = isDefined(expectedIncome) && isPositiveNumber(expectedIncome);
    const amountLabel = hasExpectedIncome ? formatDigits(convertFromMicroUnits(expectedIncome), currencySymbol) : '';
    const hintLabel = hasExpectedIncome
        ? t`Based on your regular income: ${amountLabel}`
        : t`Based on your regular income. None detected yet.`;

    return <Text className="text-xs text-secondary-foreground">{hintLabel}</Text>;
};
