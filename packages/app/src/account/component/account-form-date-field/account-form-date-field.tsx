import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountFormDatePicker } from '../account-form-date-picker/account-form-date-picker';

interface Props<T extends { deadline: Date | null }> {
    readonly control: Control<T>;
    readonly variant: ColorPaletteVariant;
}

export const AccountFormDateField = <T extends { deadline: Date | null }>({ control, variant }: Props<T>) => {
    const { t } = useLingui();

    const renderDateInput = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormItem className="w-auto flex-1" label={t`Expected Return Date (Optional)`}>
            <AccountFormDatePicker variant={variant} date={value} onChange={onChange} />
        </FormItem>
    );

    return <Controller render={renderDateInput} name={'deadline' as Path<T>} control={control} />;
};
