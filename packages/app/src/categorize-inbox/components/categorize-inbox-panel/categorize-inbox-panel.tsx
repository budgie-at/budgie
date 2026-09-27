import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Footer } from '../../../@generic/component/footer/footer';
import { CategorizeInboxPanelSlotEnum } from '../../enum/categorize-inbox-panel-slot.enum';
import { useCategorizeInboxPanelSlot } from '../../hook/use-categorize-inbox-panel-slot.hook';
import { CategorizeInboxAcceptAllButton } from '../categorize-inbox-accept-all-button/categorize-inbox-accept-all-button';
import { CategorizeInboxPanelHint } from '../categorize-inbox-panel-hint/categorize-inbox-panel-hint';
import { CategorizeInboxProgress } from '../categorize-inbox-progress/categorize-inbox-progress';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import { CategorizeInboxPanelSelector } from './categorize-inbox-panel.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxLastWriteInterface } from '../../interface/categorize-inbox-last-write.interface';

interface Props {
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly onUndo: () => void;
}

export const CategorizeInboxPanel = ({ remainingCount, categorizedCount, acceptableAssignments, lastWrite, onUndo }: Props) => {
    const slot = useCategorizeInboxPanelSlot(lastWrite, isNotEmptyArray(acceptableAssignments));

    const isLastAction = slot === CategorizeInboxPanelSlotEnum.LAST_ACTION && isDefined(lastWrite);

    return (
        <Footer>
            <View className="gap-y-lg pb-md" testID={CategorizeInboxPanelSelector.Panel}>
                <CategorizeInboxProgress remainingCount={remainingCount} categorizedCount={categorizedCount} />

                <View className="h-14 justify-center">
                    {isLastAction ? (
                        <CategorizeInboxUndoBar key={lastWrite.sequence} assignments={lastWrite.assignments} onUndo={onUndo} />
                    ) : null}
                    {slot === CategorizeInboxPanelSlotEnum.ACCEPT_ALL ? (
                        <CategorizeInboxAcceptAllButton assignments={acceptableAssignments} />
                    ) : null}
                    {slot === CategorizeInboxPanelSlotEnum.HINT ? <CategorizeInboxPanelHint /> : null}
                </View>
            </View>
        </Footer>
    );
};
