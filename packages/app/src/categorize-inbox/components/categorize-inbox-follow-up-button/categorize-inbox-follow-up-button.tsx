import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxStrategy } from '../../context/categorize-inbox-strategy.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxUndoBarSelector } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignment: CategorizeInboxAssignmentInterface;
}

export const CategorizeInboxFollowUpButton = ({ assignment }: Props) => {
    const { followUp } = useCategorizeInboxStrategy();
    const { hasAppliedFollowUp, applyFollowUp } = useCategorizeInboxContext();

    const handlePress = (): void => void applyFollowUp(assignment);

    if (!isDefined(followUp)) {
        return null;
    }

    const accessibilityState = { disabled: hasAppliedFollowUp };
    const content = hasAppliedFollowUp ? (
        <Icon icon={UserIconNameEnum.Check} size={18} className="text-positive-foreground" />
    ) : (
        <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
            {followUp.title}
        </Text>
    );

    return (
        <HapticPressable
            onPress={handlePress}
            disabled={hasAppliedFollowUp}
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
