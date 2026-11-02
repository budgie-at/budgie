import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { DashedActionRow } from '../../../@generic/component/dashed-action-row/dashed-action-row';

import { SplitEntriesAddItemFooterSelector } from './split-entries-add-item-footer.selector';

interface Props {
    readonly canAddEntry: boolean;
    readonly onAddEntry: () => void;
}

const ANIMATION_DURATION = 200;
const ENTERING = FadeIn.duration(ANIMATION_DURATION).reduceMotion(ReduceMotion.System);
const EXITING = FadeOut.duration(ANIMATION_DURATION).reduceMotion(ReduceMotion.System);

export const SplitEntriesAddItemFooter = ({ canAddEntry, onAddEntry }: Props) => (
    <View>
        {canAddEntry ? (
            <Animated.View entering={ENTERING} exiting={EXITING}>
                <DashedActionRow icon={UserIconNameEnum.Plus} onPress={onAddEntry} testID={SplitEntriesAddItemFooterSelector.AddItemButton}>
                    <Trans>Add item</Trans>
                </DashedActionRow>
            </Animated.View>
        ) : null}
    </View>
);
