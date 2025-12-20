import { CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';

interface Props {
    readonly amount: number;
    readonly category: CategoryEntityInterface | null;
    readonly type: TransactionTypeEnum;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly onCategoryChange: (categoryId: number) => void;
}

export const AiTransactionPreviewCard = ({ amount, category, type, onConfirm, onCancel, onCategoryChange }: Props) => {
    const { t } = useLingui();
    const categorySheetRef = useRef<BottomSheetInterface | null>(null);

    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency, true);

    const variant = TRANSACTION_COLOR[type];
    const icon = isDefined(category) ? category.icon : 'Receipt';
    const microAmount = convertToMicroUnits(amount);

    const handleOpenCategorySheet = () => void categorySheetRef.current?.open();

    return (
        <>
            <Card className="mt-4 p-5xl gap-y-4xl">
                <HapticPressable onPress={handleOpenCategorySheet} className="flex-row items-center gap-x-lg">
                    <CircleIcon size="lg" icon={ICONS[icon]} variant={variant} />
                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs uppercase">
                            <Trans>AI Suggestion</Trans>
                        </Text>
                        <Text className="text-primary text-lg font-semibold">
                            {isDefined(category) ? category.title : t`Unknown Category`}
                        </Text>
                    </View>
                    <Icon icon={ICONS.ChevronRight} size={20} className="text-secondary-foreground" />
                </HapticPressable>

                <View className="bg-secondary-background rounded-2xl p-4xl">
                    <Text className="text-secondary-foreground text-xs uppercase mb-xs">
                        <Trans>Amount</Trans>
                    </Text>
                    <Text className="text-destructive-foreground text-2xl font-bold">{formatMoney(microAmount)}</Text>
                </View>

                <View className="flex-row gap-x-lg">
                    <HapticPressable
                        onPress={onCancel}
                        className="flex-1 py-4xl rounded-2xl bg-secondary-background items-center justify-center"
                    >
                        <View className="flex-row items-center gap-x-sm">
                            <Icon icon={ICONS.X} size={18} className="text-secondary-foreground" />
                            <Text className="text-secondary-foreground font-medium">
                                <Trans>Cancel</Trans>
                            </Text>
                        </View>
                    </HapticPressable>

                    <HapticPressable
                        onPress={onConfirm}
                        className="flex-1 py-4xl rounded-2xl bg-positive-background items-center justify-center"
                    >
                        <View className="flex-row items-center gap-x-sm">
                            <Icon icon={ICONS.Check} size={18} className="text-positive-foreground" />
                            <Text className="text-positive-foreground font-medium">
                                <Trans>Confirm</Trans>
                            </Text>
                        </View>
                    </HapticPressable>
                </View>
            </Card>

            <CategorySelectorBottomSheet variant={variant} selectedCategory={category} onSelect={onCategoryChange} ref={categorySheetRef} />
        </>
    );
};
