import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DashedActionRow } from '../../../@generic/component/dashed-action-row/dashed-action-row';
import { MOTION_FADE_IN, MOTION_FADE_OUT } from '../../../@generic/constant/motion.constant';

import { SplitEntriesAddItemFooterSelector } from './split-entries-add-item-footer.selector';

interface Props {
    readonly canAddEntry: boolean;
    readonly onAddEntry: () => void;
}

export const SplitEntriesAddItemFooter = ({ canAddEntry, onAddEntry }: Props) => (
    <View>
        {canAddEntry ? (
            <Animated.View entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT}>
                <DashedActionRow icon={UserIconNameEnum.Plus} onPress={onAddEntry} testID={SplitEntriesAddItemFooterSelector.AddItemButton}>
                    <Trans>Add item</Trans>
                </DashedActionRow>
            </Animated.View>
        ) : null}
    </View>
);
