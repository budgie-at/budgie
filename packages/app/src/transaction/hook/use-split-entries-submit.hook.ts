import { logAndContinue } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { useMorphingSheetDismiss } from '../../@generic/context/morphing-sheet.context';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { stripLocalId, withEntryAmount } from '../utils/entry-with-local-id.util';

import type { EntryWithLocalIdInterface } from '../utils/entry-with-local-id.util';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const useSplitEntriesSubmit = (
    entries: EntryWithLocalIdInterface[],
    totalAmount: number,
    onConfirm: (entries: TransactionEntryCreateInputInterface[]) => void
) => {
    const dismiss = useMorphingSheetDismiss();

    const handleConfirm = () => {
        onConfirm(entries.map(stripLocalId));
        dismiss();
    };

    const handleRemoveSplit = () => {
        const [firstEntry] = entries;

        if (!isDefined(firstEntry)) {
            return;
        }

        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const confirmed = yield* confirmAlert({
                        title: t`Remove split?`,
                        message: t`This will keep one entry with the full transaction amount.`,
                        confirmText: t`Remove split`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (confirmed) {
                        onConfirm([stripLocalId(withEntryAmount(firstEntry, totalAmount))]);
                        dismiss();
                    }
                })
            )
        );
    };

    return { handleConfirm, handleRemoveSplit };
};
