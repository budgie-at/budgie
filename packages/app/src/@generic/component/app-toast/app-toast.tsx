import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { ToastActionInterface } from '../../interface/toast-action.interface';
import type { ReactNode } from 'react';
import type { ToastType } from 'react-native-toast-message';

interface Props {
    readonly text1?: string;
    readonly text2?: string;
    readonly type: ToastType;
    readonly children?: ReactNode;
    readonly action?: ToastActionInterface;
}

const ACTION_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const getToastVariant = (type: ToastType): ColorPaletteVariant => {
    if (type === 'error') {
        return 'destructive';
    }

    if (type === 'success') {
        return 'positive';
    }

    return 'secondary';
};

const getToastIcon = (type: ToastType): UserIconNameEnum => {
    if (type === 'error') {
        return UserIconNameEnum.CircleAlert;
    }

    if (type === 'success') {
        return UserIconNameEnum.CircleCheck;
    }

    return UserIconNameEnum.Info;
};

export const AppToast = ({ text1, text2, type, children, action }: Props) => {
    const variant = getToastVariant(type);
    const icon = getToastIcon(type);
    const handleAction = () => {
        Toast.hide();
        action?.onPress();
    };

    return (
        <View className="w-[92%] flex-row items-center gap-x-lg rounded-5xl border border-secondary-corner bg-primary-reverse p-lg shadow-lg">
            {children ?? <CircleIcon icon={icon} variant={variant} border={false} size={36} iconSize={20} />}

            <View className="flex-1">
                {isNotEmptyString(text1) ? <Text className="text-sm font-semibold text-primary">{text1}</Text> : null}
                {isNotEmptyString(text2) ? <Text className="mt-xxs text-xs font-medium text-secondary-foreground">{text2}</Text> : null}
            </View>

            {isDefined(action) ? (
                <HapticPressable
                    onPress={handleAction}
                    hitSlop={ACTION_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    className="rounded-full bg-surface-fill px-xl py-xs active:opacity-70"
                >
                    <Text className="text-[15px] font-semibold text-primary">{action.label}</Text>
                </HapticPressable>
            ) : null}
        </View>
    );
};
