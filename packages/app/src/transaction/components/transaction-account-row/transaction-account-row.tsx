import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';

const ANIMATION_DELAY = 170;

export interface TransactionAccountRowRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAccountRowRef | null>;
    readonly variant: ColorPaletteVariant;
    readonly fieldName: 'fromAccountId' | 'toAccountId';
    readonly label?: string;
}

export const TransactionAccountRow = ({ ref, variant, fieldName, label }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const accountId = useWatch({ control, name: fieldName });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);

    const handlePress = async () => {
        const selectedAccountId = await openAccountSelector({ initialAccountId: accountId });

        if (isDefined(selectedAccountId)) {
            setValue(fieldName, selectedAccountId);
        }
    };

    const displayLabel = label ?? t`Account`;
    const accessibilityLabel = `${displayLabel}: ${account?.title ?? t`Select`}`;

    return (
        <Animated.View entering={FadeInUp.delay(ANIMATION_DELAY).duration(200)}>
            <Animated.View style={shakeStyle}>
                <HapticPressable
                    className="flex-row items-center px-lg py-md gap-md bg-secondary-background rounded-2xl"
                    onPress={handlePress}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole="button"
                >
                    <CircleIcon icon={account?.icon ?? UserIconNameEnum.Wallet} variant={variant} size={28} iconSize={14} radius={8} />

                    <View className="flex-1">
                        <Text className="text-xs text-secondary-foreground uppercase">{displayLabel}</Text>
                        <Text className="text-md font-medium text-primary" numberOfLines={1}>
                            {account?.title ?? t`Select account`}
                        </Text>
                    </View>

                    <Icon icon={UserIconNameEnum.ChevronDown} size={16} className="text-secondary-foreground" />
                </HapticPressable>
            </Animated.View>
        </Animated.View>
    );
};
