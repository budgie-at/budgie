import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import { CategorizeInboxUndoBarSelector } from './categorize-inbox-undo-bar.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly assignedRowCount: number;
    readonly onUndo: () => void;
    readonly onDismiss: () => void;
    readonly children?: ReactNode;
}

export const CategorizeInboxUndoBar = ({ assignedRowCount, onUndo, onDismiss, children }: Props) => {
    const { t } = useLingui();

    const countText = t({ message: plural(assignedRowCount, { one: '# categorized', other: '# categorized' }) });

    return (
        <View className="flex-row items-center gap-x-lg bg-primary rounded-3xl mx-5xl mb-xl p-xl">
            <Text className="text-primary-reverse text-sm flex-1" numberOfLines={1}>
                {countText}
            </Text>

            {children}

            <Button content={t`Undo`} onPress={onUndo} size="sm" variant="secondary" testID={CategorizeInboxUndoBarSelector.UndoButton} />

            <HapticPressable
                onPress={onDismiss}
                accessibilityRole="button"
                accessibilityLabel={t`Dismiss`}
                testID={CategorizeInboxUndoBarSelector.DismissButton}
            >
                <Icon icon={UserIconNameEnum.X} className="text-primary-reverse" size={18} />
            </HapticPressable>
        </View>
    );
};
