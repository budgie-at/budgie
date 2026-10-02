import { useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';

import type { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';

interface QuickImportResult {
    readonly isLoading: boolean;
    readonly handleQuickImport: () => void;
}

export const useQuickImport = (config: QuickImportConfigInterface | null): QuickImportResult => {
    const { t } = useLingui();

    const [isLoading, setIsLoading] = useState(false);

    const showImportDoneToast = (importResult: FileBankSyncImportResultInterface) => {
        const hasAccounts = isPositiveNumber(importResult.accountCount);
        const hasNewTransactions = isPositiveNumber(importResult.newTransactionCount);

        if (!hasAccounts) {
            Toast.show({
                type: 'success',
                text1: t`No matching accounts`,
                text2: t`No enabled accounts were found in this file`
            });

            return;
        }

        const title = hasNewTransactions ? t`Transactions imported` : t`No new transactions`;
        const { newTransactionCount } = importResult;
        const { existingTransactionCount } = importResult;
        const { parsedTransactionCount } = importResult;
        const message = t`${newTransactionCount} new, ${existingTransactionCount} already imported, ${parsedTransactionCount} checked`;

        Toast.show({ type: 'success', text1: title, text2: message });
    };

    const handleQuickImport = () => {
        if (!isDefined(config)) {
            return;
        }

        if (isLoading) {
            return;
        }

        setIsLoading(true);
        appRuntime.runFork(
            Effect.gen(function* () {
                const result = yield* Effect.promise(() =>
                    DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true })
                );
                const uri = result.assets?.at(0)?.uri;

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                Toast.show({ type: 'info', text1: t`Import started`, text2: t`Budgie will notify you when it finishes` });
                showImportDoneToast(yield* config.importHandler(uri));
            }).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catchCause(cause => Effect.sync(() => void showErrorToast(t`Import failed`, getErrorMessage(Cause.squash(cause))))),
                Effect.ensuring(Effect.sync(() => void setIsLoading(false)))
            )
        );
    };

    return { isLoading, handleQuickImport };
};
