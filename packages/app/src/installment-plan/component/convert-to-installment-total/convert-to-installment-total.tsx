import { useLingui } from '@lingui/react/macro';
import { addMonths, isAfter } from 'date-fns';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { useDebtDeadlineDate } from '../../../account/hook/use-debt-deadline-date.hook';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'amount' | 'instrumentSymbol' | 'operatedAt'>;
}

export const ConvertToInstallmentTotal = ({ params }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const { formatMonthAndDay } = useFormatDate();
    const today = useDebtDeadlineDate();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const [installmentCount, totalAmount] = useWatch({ control, name: ['installmentCount', 'totalAmount'] });

    const isEqualParts = convertToMicroUnits(totalAmount) === params.amount * installmentCount;
    const partAmount = isEqualParts ? convertFromMicroUnits(params.amount) : totalAmount / installmentCount;
    const formattedPartAmount = formatDigits(partAmount, params.instrumentSymbol);
    const partsLabel = isEqualParts ? `${installmentCount} × ${formattedPartAmount}` : t`≈ ${formattedPartAmount} per payment`;
    const lastPaymentAt = addMonths(params.operatedAt, installmentCount - 1);
    const lastPaymentDate = formatMonthAndDay(lastPaymentAt);
    const hasUpcomingPayments = isAfter(lastPaymentAt, today);

    const render = ({ field: { value, onChange } }: UseControllerReturn<ConvertToInstallmentFormValues, 'totalAmount'>) => (
        <FormAmountInput
            value={value}
            onChange={onChange}
            instrumentSymbol={params.instrumentSymbol}
            variant="default"
            testID={ConvertToInstallmentModalSelector.TotalInput}
        />
    );

    return (
        <View className="items-center gap-y-xs">
            <Controller control={control} name="totalAmount" render={render} />
            <ProtectedText
                className="text-md font-medium text-secondary-foreground tabular-nums"
                testID={ConvertToInstallmentModalSelector.PartsLabel}
            >
                {partsLabel}
            </ProtectedText>
            {hasUpcomingPayments ? <Text className="text-sm text-secondary-foreground">{t`Last payment ${lastPaymentDate}`}</Text> : null}
        </View>
    );
};
