import { CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';

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

    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const variant = TRANSACTION_COLOR[type];
    const icon = isDefined(category) ? category.icon : 'Receipt';
    const microAmount = convertToMicroUnits(amount);

    const handleOpenCategorySheet = () => void categorySheetRef.current?.open();

    return (
        <>
            <Card className="mt-4 p-5xl gap-y-4xl">
                <HapticPressable onPress={handleOpenCategorySheet} className="flex-row items-center gap-x-lg">
                    <CircleIcon size={34} iconSize={18} icon={icon} variant={variant} />

                    <View className="flex-1">
                        <Text className="text-secondary-foreground text-xs uppercase">
                            <Trans>AI Suggestion</Trans>
                        </Text>
                        <Text className="text-primary text-lg font-semibold">
                            {isDefined(category) ? category.title : t`Unknown Category`}
                        </Text>
                    </View>
                    <Icon icon="ChevronRight" size={20} className="text-secondary-foreground" />
                </HapticPressable>

                <View className="bg-secondary-background rounded-2xl p-4xl">
                    <Text className="text-secondary-foreground text-xs uppercase mb-xs">
                        <Trans>Amount</Trans>
                    </Text>
                    <Text className="text-destructive-foreground text-2xl font-bold">
                        {formatDigits(microAmount, defaultInstrument.symbol)}
                    </Text>
                </View>

                <View className="flex-row gap-x-lg">
                    <HapticPressable
                        onPress={onCancel}
                        className="flex-1 py-4xl rounded-2xl bg-secondary-background items-center justify-center"
                    >
                        <View className="flex-row items-center gap-x-sm">
                            <Icon icon="X" size={18} className="text-secondary-foreground" />
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
                            <Icon icon="Check" size={18} className="text-positive-foreground" />
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
