/* jscpd:ignore-start - Transfer account selector similar to single account row but with dual accounts and swap */
import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { forwardRef, useImperativeHandle } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';

const ANIMATION_DELAY = 170;

interface Props {
    readonly variant: ColorPaletteVariant;
}

export interface TransactionTransferAccountsRowRef {
    shakeFrom: () => void;
    shakeTo: () => void;
}

// eslint-disable-next-line max-statements -- Component manages dual account selectors with shake animations
export const TransactionTransferAccountsRow = forwardRef<TransactionTransferAccountsRowRef, Props>(({ variant }, ref) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const { openAccountSelector } = useAccountSelectorModal();
    const { shake: shakeFrom, animatedStyle: fromAnimatedStyle } = useShakeAnimation();
    const { shake: shakeTo, animatedStyle: toAnimatedStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shakeFrom, shakeTo }));

    const fromAccountId = useWatch({ control, name: 'fromAccountId' });
    const toAccountId = useWatch({ control, name: 'toAccountId' });

    const { account: fromAccount } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { account: toAccount } = useGetAccountByIdQuery(toAccountId ?? 0);

    const handleFromPress = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: fromAccountId,
            excludeAccountId: toAccountId
        });

        if (selectedAccountId !== null) {
            setValue('fromAccountId', selectedAccountId);
            setValue('entries.0.accountId', selectedAccountId);
        }
    };

    const handleToPress = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: toAccountId,
            excludeAccountId: fromAccountId
        });

        if (selectedAccountId !== null) {
            setValue('toAccountId', selectedAccountId);
            setValue('entries.1.accountId', selectedAccountId);
        }
    };

    const handleSwap = () => {
        setValue('fromAccountId', toAccountId);
        setValue('toAccountId', fromAccountId);
        setValue('entries.0.accountId', toAccountId ?? 0);
        setValue('entries.1.accountId', fromAccountId ?? 0);
    };

    const fromAccessibilityLabel = `${t`From`}: ${fromAccount?.title ?? t`Select`}`;
    const toAccessibilityLabel = `${t`To`}: ${toAccount?.title ?? t`Select`}`;

    return (
        <Animated.View entering={FadeInUp.delay(ANIMATION_DELAY).duration(200)} className="flex-row items-center gap-sm mx-xl">
            <Animated.View style={fromAnimatedStyle} className="flex-1">
                <HapticPressable
                    className="flex-row items-center px-md py-md gap-sm bg-secondary-background rounded-2xl"
                    onPress={handleFromPress}
                    accessibilityLabel={fromAccessibilityLabel}
                    accessibilityRole="button"
                >
                    <CircleIcon icon={fromAccount?.icon ?? UserIconNameEnum.Wallet} variant={variant} size={32} iconSize={16} radius={10} />

                    <View className="flex-1">
                        <Text className="text-2xs text-secondary-foreground uppercase">{t`From`}</Text>
                        <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                            {fromAccount?.title ?? t`Select`}
                        </Text>
                    </View>

                    <Icon icon={UserIconNameEnum.ChevronDown} size={14} className="text-secondary-foreground" />
                </HapticPressable>
            </Animated.View>

            <HapticPressable onPress={handleSwap} accessibilityLabel={t`Swap accounts`} accessibilityRole="button">
                <CircleIcon icon={UserIconNameEnum.ArrowLeftRight} variant="ghost" size={32} iconSize={14} />
            </HapticPressable>

            <Animated.View style={toAnimatedStyle} className="flex-1">
                <HapticPressable
                    className="flex-row items-center px-md py-md gap-sm bg-secondary-background rounded-2xl"
                    onPress={handleToPress}
                    accessibilityLabel={toAccessibilityLabel}
                    accessibilityRole="button"
                >
                    <CircleIcon icon={toAccount?.icon ?? UserIconNameEnum.Wallet} variant={variant} size={32} iconSize={16} radius={10} />

                    <View className="flex-1">
                        <Text className="text-2xs text-secondary-foreground uppercase">{t`To`}</Text>
                        <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                            {toAccount?.title ?? t`Select`}
                        </Text>
                    </View>

                    <Icon icon={UserIconNameEnum.ChevronDown} size={14} className="text-secondary-foreground" />
                </HapticPressable>
            </Animated.View>
        </Animated.View>
    );
});
/* jscpd:ignore-end */
