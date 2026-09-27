import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxUndoBarSelector } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar.selector';

import type { CategorizeInboxLastWriteInterface } from '../../interface/categorize-inbox-last-write.interface';

interface Props {
    readonly lastWrite: CategorizeInboxLastWriteInterface;
    readonly onFollowUp: (lastWrite: CategorizeInboxLastWriteInterface) => Promise<void>;
}

export const CategorizeInboxFollowUpButton = ({ lastWrite, onFollowUp }: Props) => {
    const { t } = useLingui();
    const { strategy } = useCategorizeInboxContext();

    const handlePress = (): void => void onFollowUp(lastWrite);

    const isApplied = isNotEmptyArray(lastWrite.followUpAssignments);
    const accessibilityState = { disabled: isApplied };

    if (!isDefined(strategy.pickFollowUpTagIds)) {
        return null;
    }

    return (
        <HapticPressable
            onPress={handlePress}
            disabled={isApplied}
            className="h-11 items-center justify-center px-sm"
            accessibilityRole="button"
            accessibilityLabel={t`Add tags to these transactions`}
            accessibilityState={accessibilityState}
            testID={CategorizeInboxUndoBarSelector.FollowUpButton}
        >
            {isApplied ? (
                <Icon icon={UserIconNameEnum.Check} size={18} className="text-positive-foreground" />
            ) : (
                <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
                    <Trans>+ Tags</Trans>
                </Text>
            )}
        </HapticPressable>
    );
};
