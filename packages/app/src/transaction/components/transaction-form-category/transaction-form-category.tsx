import { TransactionAssociationEnum, TransactionCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn, useWatch } from 'react-hook-form';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { TransactionSplit } from '../transaction-split/transaction-split';

interface Props {
    readonly control: Control<TransactionCreateEntityInterface>;
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
    }: UseControllerReturn<TransactionCreateEntityInterface, 'entries.0.categoryId'>) => {
        const status = invalid ? 'error' : 'default';

        return <CategorySelector status={status} error={error?.message} categoryId={value} onSelect={onChange} variant={variant} />;
    };

    return (
        <FormItem label={t`Category`}>
            {entries.length === 1 ? <Controller render={renderCategorySelector} name="entries.0.categoryId" control={control} /> : null}

            <TransactionSplit variant={variant} control={control} />
        </FormItem>
    );
};
