import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { setPrimaryCategory } from '../../utils/set-primary-category.util';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon, TransactionFieldIconRef } from '../transaction-field-icon/transaction-field-icon';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { RefObject } from 'react';

interface Props {
    readonly ref: RefObject<TransactionFieldIconRef | null>;
    readonly variant: ColorPaletteVariant;
    readonly isSplitActive: boolean;
}

export const TransactionCategoryFieldIcon = ({ ref, variant, isSplitActive }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openCategorySelector] = useCategorySelectorModal();
    const entries = useWatch({ control, name: 'entries' });
    const categoryId = getTransactionCategoryEntries(entries).at(0)?.categoryId ?? null;
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handlePress = () => {
        openCategorySelector({ initialCategoryId: categoryId, variant }, selectedCategoryId => {
            if (!isDefined(selectedCategoryId)) {
                return;
            }

            const updatedEntries = setPrimaryCategory(entries, selectedCategoryId);

            if (isDefined(updatedEntries)) {
                setValue('entries', updatedEntries, { shouldValidate: false });
            }
        });
    };

    const categoryIcon = category?.icon ?? UserIconNameEnum.CircleDashed;
    const disabledHint = isSplitActive ? t`Categories are set per split item` : void 0;

    return (
        <TransactionFieldIcon
            ref={ref}
            icon={categoryIcon}
            label={t`Category`}
            value={category?.title}
            placeholder={
                <Text
                    className="min-w-0 flex-1 text-right text-[17px] leading-[22px] text-attention-foreground"
                    maxFontSizeMultiplier={2}
                    numberOfLines={1}
                >
                    {t`Uncategorized`}
                </Text>
            }
            onPress={handlePress}
            disabledHint={disabledHint}
            testID={SimpleQuickFormSelector.CategorySelector}
        />
    );
};
