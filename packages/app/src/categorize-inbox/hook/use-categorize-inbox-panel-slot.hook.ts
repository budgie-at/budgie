import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxPanelSlotEnum } from '../enum/categorize-inbox-panel-slot.enum';

import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';

const LAST_ACTION_PRIORITY_MS = 6000;

export const useCategorizeInboxPanelSlot = (
    lastWrite: CategorizeInboxLastWriteInterface | null,
    hasAcceptableAssignments: boolean
): CategorizeInboxPanelSlotEnum => {
    const [expiredWrite, setExpiredWrite] = useState<CategorizeInboxLastWriteInterface | null>(null);

    useEffect(() => {
        const timeout = isDefined(lastWrite) ? setTimeout(() => void setExpiredWrite(lastWrite), LAST_ACTION_PRIORITY_MS) : null;

        return () => {
            if (isDefined(timeout)) {
                clearTimeout(timeout);
            }
        };
    }, [lastWrite]);

    const hasLastAction = isDefined(lastWrite);
    const isLastActionFresh = hasLastAction && expiredWrite !== lastWrite;

    if (isLastActionFresh || (hasLastAction && !hasAcceptableAssignments)) {
        return CategorizeInboxPanelSlotEnum.LAST_ACTION;
    }

    return hasAcceptableAssignments ? CategorizeInboxPanelSlotEnum.ACCEPT_ALL : CategorizeInboxPanelSlotEnum.HINT;
};
