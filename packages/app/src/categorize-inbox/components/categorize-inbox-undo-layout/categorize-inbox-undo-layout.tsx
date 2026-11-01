import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { CategorizeInboxUndoBarSelector } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly onUndo: () => void;
    readonly children?: ReactNode;
}

const UNDO_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 } as const;

export const CategorizeInboxUndoLayout = ({ title, description, onUndo, children }: Props) => (
    <View
        className="min-h-14 flex-row items-center gap-x-md py-xs"
        accessibilityLiveRegion="polite"
        testID={CategorizeInboxUndoBarSelector.Bar}
    >
        <View className="flex-1" accessible>
            <Text className="text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={2}>
                {title}
            </Text>
            <Text className="mt-xxs text-[13px] leading-[17px] text-secondary-foreground" numberOfLines={2}>
                {description}
            </Text>
        </View>

        {children}

        <HapticPressable
            onPress={onUndo}
            className="min-h-[36px] flex-row items-center gap-x-xs rounded-full bg-primary px-xl"
            hitSlop={UNDO_HIT_SLOP}
            accessibilityRole="button"
            testID={CategorizeInboxUndoBarSelector.UndoButton}
        >
            <Icon icon={UserIconNameEnum.Undo2} size={14} className="text-primary-reverse" />
            <Text className="text-sm font-semibold text-primary-reverse">
                <Trans>Undo</Trans>
            </Text>
        </HapticPressable>
    </View>
);
