import { CategoryEntityInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useAccountSelector } from '../../../account/hooks/use-account-selector.hook';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { AiTransactionAmountDisplay } from '../ai-transaction-amount-display/ai-transaction-amount-display';
import { AiTransactionCancelButton } from '../ai-transaction-cancel-button/ai-transaction-cancel-button';
import { AiTransactionConfirmButton } from '../ai-transaction-confirm-button/ai-transaction-confirm-button';

interface Props {
    readonly amount: number;
    readonly category: CategoryEntityInterface | null;
    readonly type: TransactionTypeEnum;
    readonly accountId: number | null;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly onCategoryChange: (categoryId: number) => void;
    readonly onAccountChange: (accountId: number) => void;
}

/* eslint-disable lingui/no-unlocalized-strings */
const CONFIRM_BUTTON_ENABLED = 'flex-1 py-4xl rounded-2xl bg-positive-background items-center justify-center';
const CONFIRM_BUTTON_DISABLED = 'flex-1 py-4xl rounded-2xl bg-secondary-background items-center justify-center opacity-50';
const ACCOUNT_TEXT_SELECTED = 'text-primary text-lg font-semibold';
const ACCOUNT_TEXT_MISSING = 'text-warning-foreground text-lg font-semibold';
const ICON_CLASS_ENABLED = 'text-positive-foreground';
const ICON_CLASS_DISABLED = 'text-secondary-foreground';
const TEXT_CLASS_ENABLED = 'text-positive-foreground font-medium';
const TEXT_CLASS_DISABLED = 'text-secondary-foreground font-medium';
/* eslint-enable lingui/no-unlocalized-strings */

export const AiTransactionPreviewCard = ({
    amount,
    category,
    type,
    accountId,
    onConfirm,
    onCancel,
    onCategoryChange,
    onAccountChange
}: Props) => {
    const categorySheetRef = useRef<BottomSheetInterface | null>(null);
    const accountSheetRef = useRef<BottomSheetInterface | null>(null);

    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const {
        selectedAccount,
        icon: accountIcon,
        renderBottomSheet
    } = useAccountSelector({
        accountId,
        onSelect: onAccountChange,
        excludeAccountId: null
    });

    const variant = TRANSACTION_COLOR[type];
    const categoryIcon = isDefined(category) ? category.icon : UserIconNameEnum.Receipt;
    const canConfirm = isDefined(selectedAccount);
    const accountTextClass = canConfirm ? ACCOUNT_TEXT_SELECTED : ACCOUNT_TEXT_MISSING;
    const confirmProps = {
        canConfirm,
        onConfirm,
        confirmButtonClass: canConfirm ? CONFIRM_BUTTON_ENABLED : CONFIRM_BUTTON_DISABLED,
        confirmIconClass: canConfirm ? ICON_CLASS_ENABLED : ICON_CLASS_DISABLED,
        confirmTextClass: canConfirm ? TEXT_CLASS_ENABLED : TEXT_CLASS_DISABLED
    };

    const handleOpenCategorySheet = () => void categorySheetRef.current?.open();
    const handleOpenAccountSheet = () => void accountSheetRef.current?.open();

    const formattedAmount = formatDigits(amount, selectedAccount?.instrument.symbol ?? defaultInstrument.symbol);

    return (
        <>
            <Card className="mt-4 p-5xl gap-y-4xl">
                <HapticPressable onPress={handleOpenCategorySheet} className="flex-row items-center gap-x-lg">
                    <CircleIcon size={34} iconSize={18} icon={categoryIcon} variant={variant} />
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs uppercase">
                            <Trans>Category</Trans>
                        </Text>
                        <Text className="text-primary text-lg font-semibold">
                            {isDefined(category) ? category.title : <Trans>Unknown Category</Trans>}
                        </Text>
                    </View>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
                </HapticPressable>

                <HapticPressable onPress={handleOpenAccountSheet} className="flex-row items-center gap-x-lg">
                    <CircleIcon size={34} iconSize={18} icon={accountIcon} variant="ghost" />
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs uppercase">
                            <Trans>Account</Trans>
                        </Text>
                        <Text className={accountTextClass}>
                            {isDefined(selectedAccount) ? selectedAccount.title : <Trans>Select Account</Trans>}
                        </Text>
                    </View>
                    <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
                </HapticPressable>

                <AiTransactionAmountDisplay formattedAmount={formattedAmount} />

                <View className="flex-row gap-x-lg">
                    <AiTransactionCancelButton onCancel={onCancel} />
                    <AiTransactionConfirmButton
                        canConfirm={confirmProps.canConfirm}
                        onConfirm={confirmProps.onConfirm}
                        confirmButtonClass={confirmProps.confirmButtonClass}
                        confirmIconClass={confirmProps.confirmIconClass}
                        confirmTextClass={confirmProps.confirmTextClass}
                    />
                </View>
            </Card>

            <CategorySelectorBottomSheet variant={variant} selectedCategory={category} onSelect={onCategoryChange} ref={categorySheetRef} />
            {renderBottomSheet(accountSheetRef)}
        </>
    );
};
