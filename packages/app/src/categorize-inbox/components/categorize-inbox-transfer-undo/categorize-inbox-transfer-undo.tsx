import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxUndoLayout } from '../categorize-inbox-undo-layout/categorize-inbox-undo-layout';

export const CategorizeInboxTransferUndo = () => {
    const { t } = useLingui();
    const { pendingTransfer, undoTransfer } = useCategorizeInboxContext();

    if (!isDefined(pendingTransfer)) {
        return null;
    }

    const { accountTitle, isRuleEnabled, transactionIds } = pendingTransfer;
    const transferCount = transactionIds.length;
    const title = t`${transferCount} now transfers`;
    const description = isRuleEnabled ? t`To ${accountTitle}, rule saved` : t`To ${accountTitle}`;

    const handleUndoPress = (): void => void undoTransfer();

    return <CategorizeInboxUndoLayout title={title} description={description} onUndo={handleUndoPress} />;
};
