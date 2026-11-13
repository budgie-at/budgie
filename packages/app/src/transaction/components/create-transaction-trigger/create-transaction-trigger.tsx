import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { CreateTransactionMenuSelector } from '../create-transaction-menu/create-transaction-menu.selector';

import type { Ref } from 'react';
import type { View } from 'react-native';

const TRIGGER_ICON_SIZE = 32;

interface Props {
    readonly isOpen: boolean;
    readonly onPress: () => void;
    readonly ref?: Ref<View>;
}

export const CreateTransactionTrigger = ({ isOpen, onPress, ref }: Props) => {
    const { t } = useLingui();
    const label = t`Add`;

    return (
        <HapticPressable
            ref={ref}
            testID={CreateTransactionMenuSelector.Trigger}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityShowsLargeContentViewer
            accessibilityLargeContentTitle={label}
            accessible
            collapsable={false}
            disabled={isOpen}
            className="bg-primary rounded-full items-center justify-center w-18 h-18"
            onPress={onPress}
            pressFeedback={HapticPressFeedbackEnum.COMMIT}
        >
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} pointerEvents="none" size={TRIGGER_ICON_SIZE} />
        </HapticPressable>
    );
};
