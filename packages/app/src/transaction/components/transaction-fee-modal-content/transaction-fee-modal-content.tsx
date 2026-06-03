import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
    readonly onConfirm: (result: TransactionFeeModalResult) => void;
}

const ROW_INDEX = 0;

export const TransactionFeeModalContent = ({ accountId, currencySymbol, entry, variant, onConfirm }: Props) => {
    const [openCategorySelector] = useCategorySelectorModal();
    const [feeEntry, setFeeEntry] = useState<TransactionEntryCreateInputInterface>(
        entry ?? {
            accountId,
            categoryId: BANK_FEE_CATEGORY_ID,
            categorySource: CategorySourceEnum.FEE,
            amount: 0,
            type: TransactionEntryTypeEnum.FEE,
            mccCategoryId: null,
            externalId: null
        }
    );

    const canSave = isPositiveNumber(feeEntry.categoryId) && feeEntry.amount > 0;
    const canRemove = isDefined(entry);

    const handleAmountChange = (amount: number) => {
        setFeeEntry(previous => ({ ...previous, amount }));
    };

    const handleCategoryPress = async () => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: feeEntry.categoryId, variant });

        if (isDefined(selectedCategoryId)) {
            const categorySource = selectedCategoryId === BANK_FEE_CATEGORY_ID ? CategorySourceEnum.FEE : CategorySourceEnum.USER;

            setFeeEntry(previous => ({ ...previous, categoryId: selectedCategoryId, categorySource }));
        }
    };

    const handleConfirm = () => {
        onConfirm([feeEntry]);
    };

    const handleRemove = async () => {
        const confirmed = await confirmAlert({
            title: t`Remove fee?`,
            message: t`This will remove the fee entry from this transaction.`,
            confirmText: t`Remove fee`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (confirmed) {
            onConfirm([]);
        }
    };

    const handleFeeCategoryPress = () => void handleCategoryPress();

    return (
        <View className="px-xl pt-3xl pb-xl gap-lg">
            <SplitEntryRow
                index={ROW_INDEX}
                categoryId={feeEntry.categoryId ?? 0}
                amount={feeEntry.amount}
                currencySymbol={currencySymbol}
                variant={variant}
                canDelete={false}
                autoFocus={!isDefined(entry)}
                onAmountChange={handleAmountChange}
                onCategoryPress={handleFeeCategoryPress}
                onDelete={handleRemove}
            />

            <View className="flex-row gap-x-md">
                {canRemove ? (
                    <Button
                        leftIcon={UserIconNameEnum.X}
                        variant="destructive"
                        size="md"
                        className="aspect-square"
                        onPress={handleRemove}
                    />
                ) : null}

                <Button className="flex-1" content={t`Save fee`} variant={variant} size="md" disabled={!canSave} onPress={handleConfirm} />
            </View>
        </View>
    );
};
