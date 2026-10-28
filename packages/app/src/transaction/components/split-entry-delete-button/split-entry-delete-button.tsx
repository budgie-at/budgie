import { UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SplitEntryRowSelector } from '../split-entry-row/split-entry-row.selector';

interface Props {
    readonly index: number;
    readonly onPress: () => void;
}

const DELETE_ICON_SIZE = 28;
const DELETE_ICON_INNER_SIZE = 14;

export const SplitEntryDeleteButton = ({ index, onPress }: Props) => (
    <HapticPressable onPress={onPress} testID={SplitEntryRowSelector.Delete(index)}>
        <CircleIcon icon={UserIconNameEnum.X} size={DELETE_ICON_SIZE} iconSize={DELETE_ICON_INNER_SIZE} border={false} variant="ghost" />
    </HapticPressable>
);
