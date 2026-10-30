import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ENTRANCE_EASING } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { CategorizeInboxAcceptAllButton } from '../categorize-inbox-accept-all-button/categorize-inbox-accept-all-button';
import { CategorizeInboxMoveAllToCashButton } from '../categorize-inbox-move-all-to-cash-button/categorize-inbox-move-all-to-cash-button';
import { CategorizeInboxMovedToCashUndo } from '../categorize-inbox-moved-to-cash-undo/categorize-inbox-moved-to-cash-undo';
import { CategorizeInboxTransferUndo } from '../categorize-inbox-transfer-undo/categorize-inbox-transfer-undo';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import { CategorizeInboxPanelSelector } from './categorize-inbox-panel.selector';

import type { ReactElement } from 'react';

interface Props {
    readonly activeSection: CategorizeInboxSectionEnum | null;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const SLOT_DURATION = 220;
const SLOT_REDUCED_DURATION = 150;
const SLOT_DISTANCE = 8;
const SLOT_MOTION = {
    entering: FadeInDown.duration(SLOT_DURATION)
        .easing(ENTRANCE_EASING)
        .withInitialValues({ opacity: 0, transform: [{ translateY: SLOT_DISTANCE }] }),
    exiting: FadeOutDown.duration(SLOT_DURATION).easing(ENTRANCE_EASING)
};
const SLOT_REDUCED_MOTION = { entering: FadeIn.duration(SLOT_REDUCED_DURATION), exiting: FadeOut.duration(SLOT_REDUCED_DURATION) };

export const CategorizeInboxPanel = ({ activeSection }: Props) => {
    const reducedMotion = useReducedMotion();
    const {
        items,
        includedRows,
        acceptableAssignments,
        cashWithdrawalTransactionIds,
        lastWrite,
        movedToCashTransactionIds,
        pendingTransfer
    } = useCategorizeInboxContext();

    const transferUndo = isDefined(pendingTransfer) ? <CategorizeInboxTransferUndo key="transfer-undo" /> : null;
    const labelUndo = isDefined(lastWrite) ? <CategorizeInboxUndoBar key="label-undo" /> : null;
    const movedToCashUndo = isNotEmptyArray(movedToCashTransactionIds) ? <CategorizeInboxMovedToCashUndo key="moved-to-cash-undo" /> : null;
    const cashRows = items
        .filter(isCategorizeInboxCluster)
        .filter(cluster => cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS)
        .flatMap(cluster => includedRows(cluster))
        .filter(row => cashWithdrawalTransactionIds.has(row.transactionId));
    const acceptAll = isNotEmptyArray(acceptableAssignments) ? <CategorizeInboxAcceptAllButton key="accept-all" /> : null;
    const moveAllToCash = isNotEmptyArray(cashRows) ? <CategorizeInboxMoveAllToCashButton key="move-all-to-cash" rows={cashRows} /> : null;
    const sectionActions: Record<CategorizeInboxSectionEnum, ReactElement | null> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: acceptAll,
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: moveAllToCash,
        [CategorizeInboxSectionEnum.REVIEW]: null,
        [CategorizeInboxSectionEnum.ONE_OFFS]: null
    };
    const primaryAction = isDefined(activeSection) ? sectionActions[activeSection] : acceptAll;
    const slot = transferUndo ?? labelUndo ?? movedToCashUndo ?? primaryAction;
    const slotMotion = reducedMotion ? SLOT_REDUCED_MOTION : SLOT_MOTION;

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
                    <Animated.View
                        key={slot.key}
                        entering={slotMotion.entering}
                        exiting={slotMotion.exiting}
                        className="absolute inset-0 justify-center"
                    >
                        {slot}
                    </Animated.View>
                </View>
            </View>
        </ScreenChromeFooter>
    );
};
