import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSelectorModalContext } from '../../context/icon-selector-modal.context';
import { useLockstepStackActions } from '../../context/lockstep-stack.context';
import { IconPickerPanel } from '../icon-picker-panel/icon-picker-panel';

import type { IconSelectorModalParams, IconSelectorResult } from '../../context/icon-selector-modal.context';
import type { ModalContextTuple } from '../../utils/create-modal-context/create-modal-context.util';
import type { UserIconType } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const ICON_SCREEN_KEY = 'ICON';
const [IconModalContext] = IconSelectorModalContext;

export const LockstepIconSelectorProvider = ({ children }: Props) => {
    const { push, pop } = useLockstepStackActions();
    const { top } = useSafeAreaInsets();
    const screenStyle = { paddingTop: top };

    const open: ModalContextTuple<IconSelectorModalParams, IconSelectorResult>[0] = (params, onResult) => {
        const outcome = { isSettled: false };
        const settle = (icon: IconSelectorResult) => {
            if (!outcome.isSettled) {
                outcome.isSettled = true;
                onResult?.(icon);
            }
        };
        const handleSelect = (icon: UserIconType) => {
            settle(icon);
            pop();
        };

        push(
            ICON_SCREEN_KEY,
            <View className="flex-1 bg-sheet-grouped-surface" style={screenStyle}>
                <IconPickerPanel
                    selectedIcon={params?.selectedIcon}
                    keywords={params?.keywords}
                    excludedIcons={params?.excludedIcons}
                    onSelect={handleSelect}
                    onBack={pop}
                />
            </View>,
            () => {
                settle(null);
            }
        );
    };

    const value: ModalContextTuple<IconSelectorModalParams, IconSelectorResult> = [open, pop, pop];

    return <IconModalContext value={value}>{children}</IconModalContext>;
};
