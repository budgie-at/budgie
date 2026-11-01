import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

const handleClose = () => {
    router.back();
};

export const SheetCloseButton = () => {
    const { t } = useLingui();

    return (
        <HapticPressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t`Close`}
            hitSlop={8}
            className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface-fill active:opacity-70"
        >
            <Icon icon={UserIconNameEnum.X} size={16} className="text-primary/80" />
        </HapticPressable>
    );
};
