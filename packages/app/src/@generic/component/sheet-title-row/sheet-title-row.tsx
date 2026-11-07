import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { SheetHeaderAction } from '../sheet-header-action/sheet-header-action';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly maxFontSizeMultiplier?: number;
    readonly closeButtonSize?: number;
    readonly trailing?: ReactNode;
    readonly onClose?: () => void;
    readonly closeLabel?: string;
    readonly disabled?: boolean;
    readonly doneTestID?: string;
}

const MAX_HEADER_FONT_SCALE = 2;

export const SheetTitleRow = ({
    title,
    trailing,
    onClose,
    closeLabel,
    disabled,
    doneTestID,
    maxFontSizeMultiplier = MAX_HEADER_FONT_SCALE
}: Props) => {
    const { t } = useLingui();
    const handleClose = onClose ?? (() => void router.back());
    const action = trailing ?? <SheetHeaderAction label={t`Done`} onPress={handleClose} testID={doneTestID} />;

    return (
        <View className="min-h-[56px] flex-row items-center gap-x-[12px] py-[6px]">
            <HapticPressable
                onPress={handleClose}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={closeLabel ?? t`Close`}
                className="h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-fill active:opacity-70"
            >
                <Icon icon={UserIconNameEnum.X} size={20} className="text-primary" />
            </HapticPressable>
            <View pointerEvents="none" className="min-w-0 flex-1 items-center justify-center">
                <Text
                    className="text-primary text-center text-[17px] font-semibold leading-[22px]"
                    accessibilityRole="header"
                    numberOfLines={2}
                    maxFontSizeMultiplier={maxFontSizeMultiplier}
                >
                    {title}
                </Text>
            </View>
            <View className="min-h-[44px] min-w-[44px] shrink-0 items-center justify-center">{action}</View>
        </View>
    );
};
