import { AccountDebtTypeEnum, AccountEntityInterface } from '@budgie/contracts';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';
import { DebtProgressRing } from '../debt-progress-ring/debt-progress-ring';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title'> {
    readonly accessibilityLabel: string;
    readonly debtType: AccountDebtTypeEnum;
    readonly percentage: number;
    readonly subtitle: ReactNode;
    readonly trailing: ReactNode;
}

export const DebtAccountCardFrame = ({ id, title, accessibilityLabel, debtType, percentage, subtitle, trailing }: Props) => {
    const handleOpenDetails = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });

    return (
        <HapticPressable
            accessibilityRole="button"
            testID={AccountCardBaseSelector.Card(title)}
            accessibilityLabel={accessibilityLabel}
            onPress={handleOpenDetails}
            className="min-h-[64px] flex-row items-center gap-x-[7px] py-lg pr-xl pl-[11px] active:scale-100 active:bg-surface-fill"
            collapsable={false}
        >
            <DebtProgressRing debtType={debtType} percentage={percentage}>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-disc">
                    <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="text-base font-semibold text-primary">
                        {title.trim().charAt(0).toLocaleUpperCase()}
                    </Text>
                </View>
            </DebtProgressRing>
            <View className="min-w-0 flex-1 items-start gap-y-xxs">
                <Text
                    className="text-[15px] font-medium text-primary"
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    ellipsizeMode="tail"
                    numberOfLines={2}
                >
                    {title}
                </Text>
                {subtitle}
            </View>
            {trailing}
        </HapticPressable>
    );
};
