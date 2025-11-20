import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly title: string;
    readonly icon?: IconName;
    readonly right?: ReactNode;
    readonly onGoBack?: EmptyFn;
    readonly className?: string;
    readonly description: string;
    readonly showBackBtn?: boolean;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
    readonly iconVariant?: ColorPaletteVariant;
}

export const AccountHeader = (props: Props) => {
    const { title, description, iconVariant = 'default', descriptionClassName, icon, className, onGoBack, right, showBackBtn } = props;

    const goBack = () => {
        void router.back();
        onGoBack?.();
    };

    return (
        <View className={cn('flex-row items-center gap-x-xl px-5xl pb-7xl border-b border-b-secondary-corner', className)}>
            {showBackBtn ? (
                <HapticPressable className="p-md" onPress={goBack}>
                    <Icon className="text-primary" icon={ICONS.ChevronLeft} size={24} />
                </HapticPressable>
            ) : null}

            {isNotEmptyString(icon) ? <CircleIcon icon={ICONS[icon]} variant={iconVariant} size="2xl" className="rounded-3xl" /> : null}

            <View className="gap-y-xs">
                <Text className="text-primary font-medium text-3xl">{title}</Text>
                <Text className={cn('text-xs text-secondary-foreground', descriptionClassName)}>{description}</Text>
            </View>

            {right}
        </View>
    );
};
