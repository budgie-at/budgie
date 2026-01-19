import { TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { TransactionFormSelectors } from '../../../@e2e/selectors/transaction-form.selector';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { TransactionSplit } from '../transaction-split/transaction-split';

interface Props {
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly accountId: number;
}

export const TransactionFormCategory = ({ variant, accountId, transactionType }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<TransactionCreateInputInterface>();

    const [entries, totalAmount] = useWatch({ control, name: ['entries', 'amount'] });

    const renderCategorySelector = ({
        field: { value, onChange },
        fieldState: { invalid, error }
    }: UseControllerReturn<TransactionCreateInputInterface, 'entries.0.categoryId'>) => {
        const cardVariant = invalid ? 'destructive' : 'primary';

        return (
            <FormItem error={error?.message}>
                <CategorySelector
                    cardVariant={cardVariant}
                    categoryId={value}
                    onSelect={onChange}
                    variant={variant}
                    testID={TransactionFormSelectors.CategorySelector}
                />
            </FormItem>
        );
    };

    return (
        <FormItem label={t`Category`}>
            {entries.length === 1 ? <Controller render={renderCategorySelector} name="entries.0.categoryId" control={control} /> : null}

            <TransactionSplit
                transactionType={transactionType}
                totalAmount={totalAmount}
                accountId={accountId}
                entries={entries}
                variant={variant}
            />
        </FormItem>
    );
};
