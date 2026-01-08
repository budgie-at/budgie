import { CategoryEntityInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { AiTransactionPreviewSelector } from '../ai-transaction-preview-selector/ai-transaction-preview-selector';

const confirmButtonVariants = cva('flex-1 py-4xl rounded-2xl items-center justify-center', {
    variants: {
        enabled: {
            true: 'bg-positive-background',
            false: 'bg-secondary-background opacity-50'
        }
    }
});

const confirmIconVariants = cva('', {
    variants: {
        enabled: {
            true: 'text-positive-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

const confirmTextVariants = cva('font-medium', {
    variants: {
        enabled: {
            true: 'text-positive-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

interface Props {
    readonly amount: number;
    readonly category: CategoryEntityInterface | null;
    readonly type: TransactionTypeEnum;
    readonly accountId: number | null;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly onCategoryChange: (categoryId: number | null) => void;
    readonly onAccountChange: (accountId: number) => void;
}

// eslint-disable-next-line max-statements
export const AiTransactionPreviewCard = (props: Props) => {
    const { amount, category, type, accountId, onConfirm, onCancel, onCategoryChange, onAccountChange } = props;
    const categorySheetRef = useRef<BottomSheetInterface | null>(null);
    const accountSheetRef = useRef<BottomSheetInterface | null>(null);

    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const {
        selectedAccount,
        icon: accountIcon,
        renderBottomSheet
    } = useAccountSelector({ accountId, onSelect: onAccountChange, excludeAccountId: null });

    const variant = TRANSACTION_COLOR[type];
    const canConfirm = isDefined(selectedAccount);
    const formattedAmount = formatDigits(amount, selectedAccount?.instrument.symbol ?? defaultInstrument.symbol);
    const categoryIcon = isDefined(category) ? category.icon : UserIconNameEnum.Receipt;

    const handleOpenCategorySheet = () => void categorySheetRef.current?.open();
    const handleOpenAccountSheet = () => void accountSheetRef.current?.open();

    const categoryValue = isDefined(category) ? category.title : <Trans>Unknown Category</Trans>;
    const accountValue = isDefined(selectedAccount) ? selectedAccount.title : <Trans>Select Account</Trans>;
    const accountValueColor = canConfirm ? ('primary' as const) : ('warning' as const);

    return (
        <>
            <Card className="mt-4 p-5xl gap-y-4xl">
                <AiTransactionPreviewSelector
                    label={<Trans>Category</Trans>}
                    value={categoryValue}
                    icon={categoryIcon}
                    variant={variant}
                    onPress={handleOpenCategorySheet}
                />

                <AiTransactionPreviewSelector
                    label={<Trans>Account</Trans>}
                    value={accountValue}
                    icon={accountIcon}
                    variant="ghost"
                    valueColor={accountValueColor}
                    onPress={handleOpenAccountSheet}
                />

                <View className="bg-secondary-background rounded-2xl p-4xl">
                    <Text className="text-secondary-foreground text-xs uppercase mb-xs">
                        <Trans>Amount</Trans>
                    </Text>
                    <Text className="text-destructive-foreground text-2xl font-bold">{formattedAmount}</Text>
                </View>

                <View className="flex-row gap-x-lg">
                    <HapticPressable
                        onPress={onCancel}
                        className="flex-1 py-4xl rounded-2xl bg-secondary-background items-center justify-center"
                    >
                        <View className="flex-row items-center gap-x-sm">
                            <Icon icon={UserIconNameEnum.X} size={18} className="text-secondary-foreground" />
                            <Text className="text-secondary-foreground font-medium">
                                <Trans>Cancel</Trans>
                            </Text>
                        </View>
                    </HapticPressable>

                    <HapticPressable disabled={!canConfirm} onPress={onConfirm} className={confirmButtonVariants({ enabled: canConfirm })}>
                        <View className="flex-row items-center gap-x-sm">
                            <Icon icon={UserIconNameEnum.Check} size={18} className={confirmIconVariants({ enabled: canConfirm })} />
                            <Text className={confirmTextVariants({ enabled: canConfirm })}>
                                <Trans>Confirm</Trans>
                            </Text>
                        </View>
                    </HapticPressable>
                </View>
            </Card>

            <CategorySelectorBottomSheet variant={variant} selectedCategory={category} onSelect={onCategoryChange} ref={categorySheetRef} />
            {renderBottomSheet(accountSheetRef)}
        </>
    );
};
