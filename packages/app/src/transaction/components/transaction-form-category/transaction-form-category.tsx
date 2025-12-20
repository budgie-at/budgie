import { TransactionAssociationEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, UseFormSetValue, useWatch } from 'react-hook-form';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { TransactionCreateInputInterface } from '../../schema/transaction-create-input.schema';
import { TransactionSplit } from '../transaction-split/transaction-split';

interface Props {
    readonly control: Control<TransactionCreateInputInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormCategory = ({ variant, control }: Props) => {
    const { t } = useLingui();

    const entries = useWatch({
        control,
        name: TransactionAssociationEnum.ENTRIES
    });

    const renderCategorySelector = ({
        field: { value, onChange },
        fieldState: { invalid, error }
    }: UseControllerReturn<TransactionCreateInputInterface, 'entries.0.categoryId'>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem error={error?.message}>
                <CategorySelector status={status} categoryId={value} onSelect={onChange} variant={variant} />
            </FormItem>
        );
    };

    return (
        <FormItem label={t`Category`}>
            {entries.length === 1 ? <Controller render={renderCategorySelector} name="entries.0.categoryId" control={control} /> : null}

            <TransactionSplit variant={variant} control={control} />
        </FormItem>
    );
};
