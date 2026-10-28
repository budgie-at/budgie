import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { QuickImportConfigInterface } from '../interface/quick-import-config.interface';

import type { FileBankSyncImportResultInterface } from '@budgie/sync';

interface QuickImportResult {
    readonly isLoading: boolean;
    readonly handleQuickImport: () => void;
}

export const useQuickImport = (config: QuickImportConfigInterface | null): QuickImportResult => {
    const { t } = useLingui();

    const { isLoading, run } = useSingleFlight();

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

        void run(
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
            }).pipe(toastOnFailure(t`Import failed`))
        );
    };

    return { isLoading, handleQuickImport };
};
