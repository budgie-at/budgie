import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxUndoLayout } from '../categorize-inbox-undo-layout/categorize-inbox-undo-layout';

export const CategorizeInboxMovedToCashUndo = () => {
    const { t } = useLingui();
    const { movedToCashTransactionIds, undoMoveToCash } = useCategorizeInboxContext();

    const description = t({
        message: plural(movedToCashTransactionIds.length, { one: '# transaction', other: '# transactions' })
    });

    const handleUndoPress = (): void => void undoMoveToCash(movedToCashTransactionIds);

    return <CategorizeInboxUndoLayout title={t`Moved to cash`} description={description} onUndo={handleUndoPress} />;
};
