import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ENTRANCE_EASING } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxAcceptAllButton } from '../categorize-inbox-accept-all-button/categorize-inbox-accept-all-button';
import { CategorizeInboxMovedToCashUndo } from '../categorize-inbox-moved-to-cash-undo/categorize-inbox-moved-to-cash-undo';
import { CategorizeInboxTransferUndo } from '../categorize-inbox-transfer-undo/categorize-inbox-transfer-undo';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import { CategorizeInboxPanelSelector } from './categorize-inbox-panel.selector';

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const SLOT_DURATION = 220;
const SLOT_REDUCED_DURATION = 150;
const SLOT_DISTANCE = 8;
const SLOT_ENTERING = FadeInDown.duration(SLOT_DURATION)
    .easing(ENTRANCE_EASING)
    .withInitialValues({ opacity: 0, transform: [{ translateY: SLOT_DISTANCE }] });
const SLOT_EXITING = FadeOutDown.duration(SLOT_DURATION).easing(ENTRANCE_EASING);
const SLOT_REDUCED_ENTERING = FadeIn.duration(SLOT_REDUCED_DURATION);
const SLOT_REDUCED_EXITING = FadeOut.duration(SLOT_REDUCED_DURATION);

export const CategorizeInboxPanel = () => {
    const reducedMotion = useReducedMotion();
    const { acceptableAssignments, lastWrite, movedToCashTransactionIds, pendingTransfer } = useCategorizeInboxContext();

    const transferUndo = isDefined(pendingTransfer) ? <CategorizeInboxTransferUndo key="transfer-undo" /> : null;
    const labelUndo = isDefined(lastWrite) ? <CategorizeInboxUndoBar key="label-undo" /> : null;
    const movedToCashUndo = isNotEmptyArray(movedToCashTransactionIds) ? <CategorizeInboxMovedToCashUndo key="moved-to-cash-undo" /> : null;
    const acceptAll = isNotEmptyArray(acceptableAssignments) ? <CategorizeInboxAcceptAllButton key="accept-all" /> : null;
    const slot = transferUndo ?? labelUndo ?? movedToCashUndo ?? acceptAll;
    const entering = reducedMotion ? SLOT_REDUCED_ENTERING : SLOT_ENTERING;
    const exiting = reducedMotion ? SLOT_REDUCED_EXITING : SLOT_EXITING;

    if (!isDefined(slot)) {
        return null;
    }

    return (
        <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
            <View
                className="border-t-hairline border-surface-separator bg-surface px-5xl pb-safe pt-md"
                testID={CategorizeInboxPanelSelector.Panel}
            >
                <View className="h-14">
                    <Animated.View key={slot.key} entering={entering} exiting={exiting} className="absolute inset-0 justify-center">
                        {slot}
                    </Animated.View>
                </View>
            </View>
        </ScreenChromeFooter>
    );
};
