import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { TransactionFormRowPlaceholderToneEnum } from '../../enum/transaction-form-row-placeholder-tone.enum';
import { setPrimaryCategory } from '../../utils/set-primary-category.util';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon, TransactionFieldIconRef } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFormRowPlaceholder } from '../transaction-form-row-placeholder/transaction-form-row-placeholder';

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
    const openCategorySelector = useOpenModal('/category-selector');
    const entries = useWatch({ control, name: 'entries' });
    const categoryId = getTransactionCategoryEntries(entries).at(0)?.categoryId ?? null;
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);
    const { account } = useGetAccountByIdQuery(entries.at(0)?.accountId ?? 0);

    const handlePress = () => {
        openCategorySelector(
            { initialCategoryId: categoryId, variant, ...(isDefined(account) && { syncZone: account.syncZone }) },
            selectedCategoryId => {
                if (!isDefined(selectedCategoryId)) {
                    return;
                }

                const updatedEntries = setPrimaryCategory(entries, selectedCategoryId);

                if (isDefined(updatedEntries)) {
                    setValue('entries', updatedEntries, { shouldValidate: false, shouldDirty: true });
                }
            }
        );
    };

    const categoryIcon = category?.icon ?? UserIconNameEnum.Folder;
    const disabledHint = isSplitActive ? t`Categories are set per split item` : void 0;

    return (
        <TransactionFieldIcon
            ref={ref}
            icon={categoryIcon}
            label={t`Category`}
            value={category?.title}
            placeholder={
                <TransactionFormRowPlaceholder
                    tone={TransactionFormRowPlaceholderToneEnum.ATTENTION}
                >{t`Uncategorized`}</TransactionFormRowPlaceholder>
            }
            onPress={handlePress}
            disabledHint={disabledHint}
            testID={SimpleQuickFormSelector.CategorySelector}
        />
    );
};
