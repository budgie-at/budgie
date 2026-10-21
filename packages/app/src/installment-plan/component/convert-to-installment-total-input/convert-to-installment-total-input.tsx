import { AmountField, AmountFieldInput } from '@budgie/amount-input';
import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';

import { useAmountFormat } from '../../../@generic/hook/use-amount-format.hook';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { INSTALLMENT_TOTAL_HERO_FONT_SIZE } from '../../constant/installment-total-hero-font-size.constant';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly instrumentSymbol: string;
    readonly onEndEditing: () => void;
}

export const ConvertToInstallmentTotalInput = ({ instrumentSymbol, onEndEditing }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();
    const amountFormat = useAmountFormat(0, `${instrumentSymbol} `);

    const render = ({ field: { value, onChange } }: UseControllerReturn<ConvertToInstallmentFormValues, 'totalAmount'>) => (
        <AmountField fontSize={INSTALLMENT_TOTAL_HERO_FONT_SIZE} className="h-20 w-full justify-center">
            <AmountFieldInput
                value={value}
                format={amountFormat}
                onChangeValue={onChange}
                onEndEditing={onEndEditing}
                autoFocus
                selectTextOnFocus
                textAlign="center"
                className="font-extralight text-primary"
                accessibilityLabel={t`Total`}
                testID={ConvertToInstallmentModalSelector.TotalInput}
            />
        </AmountField>
    );

    return <Controller control={control} name="totalAmount" render={render} />;
};
