import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly textClassName: string;
    readonly onPress: () => void;
    readonly children?: ReactNode;
    readonly testID?: string;
}

const CHEVRON_SIZE = 16;

export const ChevronLinkRow = ({ label, textClassName, onPress, children, testID }: Props) => (
    <HapticPressable
        accessibilityLabel={label}
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center gap-x-xs self-start active:opacity-70"
        testID={testID}
        onPress={onPress}
    >
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className={cn('shrink', textClassName)}>
            {children ?? label}
        </Text>
        <Icon icon={UserIconNameEnum.ChevronRight} size={CHEVRON_SIZE} className="text-secondary-foreground" />
    </HapticPressable>
);
