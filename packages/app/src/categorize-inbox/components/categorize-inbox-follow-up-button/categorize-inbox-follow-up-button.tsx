import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useState } from 'react';
import { Text } from 'react-native';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useCategorizeInboxStrategy } from '../../context/categorize-inbox-strategy.context';
import { CategorizeInboxUndoBarSelector } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignment: CategorizeInboxAssignmentInterface;
}

export const CategorizeInboxFollowUpButton = ({ assignment }: Props) => {
    const { t } = useLingui();
    const { followUp } = useCategorizeInboxStrategy();
    const [hapticNotification] = useVibration();

    const [isApplied, setIsApplied] = useState(false);

    const handleApplied = (hasApplied: boolean): void => {
        if (hasApplied) {
            setIsApplied(true);
            hapticNotification(NotificationFeedbackType.Success);
        }
    };

    const handleFailed = (error: unknown): void => {
        hapticNotification(NotificationFeedbackType.Error);
        showErrorToast(t`Could not tag transactions`, getErrorMessage(error));
    };

    const handlePress = (): void => void followUp?.apply(assignment).then(handleApplied, handleFailed);

    if (!isDefined(followUp)) {
        return null;
    }

    const accessibilityState = { disabled: isApplied };
    const content = isApplied ? (
        <Icon icon={UserIconNameEnum.Check} size={18} className="text-positive-foreground" />
    ) : (
        <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
            {followUp.title}
        </Text>
    );

    return (
        <HapticPressable
            onPress={handlePress}
            disabled={isApplied}
            className="h-11 items-center justify-center px-sm"
            accessibilityRole="button"
            accessibilityLabel={followUp.accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={CategorizeInboxUndoBarSelector.FollowUpButton}
        >
            {content}
        </HapticPressable>
    );
};
