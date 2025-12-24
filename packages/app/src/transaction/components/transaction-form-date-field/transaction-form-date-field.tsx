import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionFormDatePicker } from '../transaction-form-date-picker/transaction-form-date-picker';

interface Props {
    readonly control: Control<TransactionCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormDateField = ({ control, variant }: Props) => {
    const { t } = useLingui();

    const renderDateInput = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateInputInterface, 'operatedAt'>) => (
        <FormItem className="w-auto flex-1" label={t`Date`}>
            <TransactionFormDatePicker variant={variant} date={value} onChange={onChange} />
        </FormItem>
    );

    return <Controller render={renderDateInput} name="operatedAt" control={control} />;
};
