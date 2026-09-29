import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { CategorizeInboxUndoBarSelector } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar.selector';

import type { UserIconNameEnum } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
    readonly onUndo: () => void;
    readonly children?: ReactNode;
}

export const CategorizeInboxUndoLayout = ({ icon, title, description, onUndo, children }: Props) => (
    <View
        className="h-14 flex-row items-center gap-x-lg rounded-5xl border border-secondary-corner bg-primary-reverse pl-md"
        accessibilityLiveRegion="polite"
        testID={CategorizeInboxUndoBarSelector.Bar}
    >
        <CircleIcon icon={icon} variant="ghost" size={36} iconSize={20} border={false} />

        <View className="flex-1" accessible>
            <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
                {title}
            </Text>
            <Text className="mt-xxs text-xs font-medium text-secondary-foreground" numberOfLines={1}>
                {description}
            </Text>
        </View>

        {children}

        <HapticPressable
            onPress={onUndo}
            className="h-11 justify-center pr-xl pl-md"
            accessibilityRole="button"
            testID={CategorizeInboxUndoBarSelector.UndoButton}
        >
            <Text className="text-sm font-semibold text-primary">
                <Trans>Undo</Trans>
            </Text>
        </HapticPressable>
    </View>
);
