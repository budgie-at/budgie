import { DebtAccountCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountFormDatePicker } from '../account-form-date-picker/account-form-date-picker';

interface Props {
    readonly control: Control<DebtAccountCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
}

export const AccountFormDateField = ({ control, variant }: Props) => {
    const { t } = useLingui();

    const renderDateInput = ({ field: { value, onChange } }: UseControllerReturn<DebtAccountCreateInputInterface, 'deadline'>) => (
        <FormItem className="w-auto flex-1" label={t`Expected Return Date (Optional)`}>
            <AccountFormDatePicker variant={variant} date={value} onChange={onChange} />
        </FormItem>
    );

    return <Controller render={renderDateInput} name='deadline' control={control} />;
};
