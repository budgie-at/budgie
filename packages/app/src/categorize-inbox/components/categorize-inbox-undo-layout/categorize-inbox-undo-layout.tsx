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

export const CategorizeInboxUndoLayout = ({ title, description, onUndo, children }: Props) => (
    <View
        className="h-14 flex-row items-center gap-x-md rounded-4xl bg-secondary-background pl-3xl pr-md"
        accessibilityLiveRegion="polite"
        testID={CategorizeInboxUndoBarSelector.Bar}
    >
        <View className="flex-1" accessible>
            <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
                {title}
            </Text>
            <Text className="mt-xxs text-xs text-secondary-foreground" numberOfLines={1}>
                {description}
            </Text>
        </View>

        {children}

        <HapticPressable
            onPress={onUndo}
            className="h-9 flex-row items-center gap-x-xs rounded-full bg-primary px-xl"
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
