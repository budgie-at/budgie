import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxPanelSlotEnum } from '../enum/categorize-inbox-panel-slot.enum';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';

const LAST_ACTION_PRIORITY_MS = 6000;

export const useCategorizeInboxPanelSlot = (
    undoAssignments: CategorizeInboxAssignmentInterface[] | null,
    hasAcceptableAssignments: boolean
): CategorizeInboxPanelSlotEnum => {
    const [expiredAssignments, setExpiredAssignments] = useState<CategorizeInboxAssignmentInterface[] | null>(null);

    useEffect(() => {
        const timeout = isDefined(undoAssignments)
            ? setTimeout(() => void setExpiredAssignments(undoAssignments), LAST_ACTION_PRIORITY_MS)
            : null;

        return () => {
            if (isDefined(timeout)) {
                clearTimeout(timeout);
            }
        };
    }, [undoAssignments]);

    const hasLastAction = isDefined(undoAssignments);
    const isLastActionFresh = hasLastAction && expiredAssignments !== undoAssignments;

    if (isLastActionFresh || (hasLastAction && !hasAcceptableAssignments)) {
        return CategorizeInboxPanelSlotEnum.LAST_ACTION;
    }

    return hasAcceptableAssignments ? CategorizeInboxPanelSlotEnum.ACCEPT_ALL : CategorizeInboxPanelSlotEnum.HINT;
};
