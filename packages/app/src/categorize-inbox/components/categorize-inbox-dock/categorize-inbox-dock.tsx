import { View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { StickyFooterBand } from '../../../@generic/component/sticky-footer-band/sticky-footer-band';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxAcceptAllButton } from '../categorize-inbox-accept-all-button/categorize-inbox-accept-all-button';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly onHeightChange: (height: number) => void;
}

export const CategorizeInboxDock = ({ acceptableAssignments, onHeightChange }: Props) => {
    const { undoAssignments } = useCategorizeInboxContext();

    const handleLayout = (event: LayoutChangeEvent): void => void onHeightChange(event.nativeEvent.layout.height);

    if (!isDefined(undoAssignments) && isEmptyArray(acceptableAssignments)) {
        return null;
    }

    return (
        <StickyFooterBand>
            <View className="bg-primary-reverse pt-lg" onLayout={handleLayout}>
                <View className="gap-y-md px-5xl pb-md">
                    {isDefined(undoAssignments) ? (
                        <CategorizeInboxUndoBar key={undoAssignments[0].clusterKey} assignments={undoAssignments} />
                    ) : null}
                    {isNotEmptyArray(acceptableAssignments) ? <CategorizeInboxAcceptAllButton assignments={acceptableAssignments} /> : null}
                </View>
            </View>
        </StickyFooterBand>
    );
};
