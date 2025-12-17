import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, UseFormSetValue } from 'react-hook-form';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';

interface Props {
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateEntityInterface>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionTransferFormCategory = ({ variant, control, setValue }: Props) => {
    const { t } = useLingui();

    const renderCategorySelector = ({
        field: { value },
        fieldState: { invalid, error }
    }: UseControllerReturn<TransactionCreateEntityInterface, 'entries.0.categoryId'>) => {
        const handleChange = (categoryId: number) => {
            setValue('entries.0.categoryId', categoryId);
            setValue('entries.1.categoryId', categoryId);
        };
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem error={error?.message}>
                <CategorySelector status={status} categoryId={value} onSelect={handleChange} variant={variant} />
            </FormItem>
        );
    };

    return (
        <FormItem label={t`Category`}>
            <Controller render={renderCategorySelector} name="entries.0.categoryId" control={control} />
        </FormItem>
    );
};
