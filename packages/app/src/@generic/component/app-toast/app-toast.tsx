import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';

import type { ReactNode } from 'react';
import type { ToastType } from 'react-native-toast-message';

interface Props {
    readonly text1?: string;
    readonly text2?: string;
    readonly type: ToastType;
    readonly children?: ReactNode;
}

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

export const AppToast = ({ text1, text2, type, children }: Props) => {
    const variant = getToastVariant(type);
    const icon = getToastIcon(type);

    return (
        <View className="w-[92%] flex-row items-center gap-x-lg rounded-5xl border border-secondary-corner bg-primary-reverse p-lg shadow-lg">
            {children ?? <CircleIcon icon={icon} variant={variant} border={false} size={36} iconSize={20} />}

            <View className="flex-1">
                {isNotEmptyString(text1) ? <Text className="text-sm font-semibold text-primary">{text1}</Text> : null}
                {isNotEmptyString(text2) ? <Text className="mt-xxs text-xs font-medium text-secondary-foreground">{text2}</Text> : null}
            </View>
        </View>
    );
};
