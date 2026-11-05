import { InzhurImportService, InzhurOperationsImportService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { PDF_MIME_TYPE } from '../../sync/constant/pdf-mime-type.constant';
import { XLSX_MIME_TYPE } from '../../sync/constant/xlsx-mime-type.constant';

import type { InzhurImportSummaryInterface, InzhurOperationsImportSummaryInterface } from '@budgie/sync';

const XLSX_EXTENSION = '.xlsx';

export const useInzhurStatementImport = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const [summary, setSummary] = useState<InzhurImportSummaryInterface | null>(null);
    const [operationsSummary, setOperationsSummary] = useState<InzhurOperationsImportSummaryInterface | null>(null);

    const handleSelectFile = () =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.tryPromise({
                    try: () => DocumentPicker.getDocumentAsync({ type: [PDF_MIME_TYPE, XLSX_MIME_TYPE], copyToCacheDirectory: true }),
                    catch: cause => new NativeCallError({ cause })
                });
                const asset = result.assets?.at(0);
                const uri = asset?.uri;

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                if (asset?.mimeType === XLSX_MIME_TYPE || asset?.name.toLowerCase().endsWith(XLSX_EXTENSION) === true) {
                    setOperationsSummary(
                        yield* Effect.flatMap(InzhurOperationsImportService, inzhurOperationsImportService =>
                            inzhurOperationsImportService.importOperations(uri)
                        )
                    );

                    return;
                }

                setSummary(yield* Effect.flatMap(InzhurImportService, inzhurImportService => inzhurImportService.importStatement(uri)));
            }).pipe(
                Effect.catchTags({
                    InzhurStatementInvalidError: () =>
                        Effect.sync(
                            () =>
                                void showErrorToast(
                                    t`Not an Inzhur statement`,
                                    t`Choose the operations statement (XLSX) or the holdings statement (PDF) from Inzhur`
                                )
                        ),
                    InzhurNotSetUpError: () =>
                        Effect.sync(() => void showErrorToast(t`Inzhur is not set up`, t`Add Inzhur first, then import a statement`)),
                    InzhurPriceMissingError: ({ fundNames }) => {
                        const funds = fundNames.join(', ');

                        return Effect.sync(
                            () => void showErrorToast(t`Price not available`, t`No price yet for ${funds}. Try again tomorrow.`)
                        );
                    }
                }),
                toastOnFailure(t`Import failed`)
            )
        );

    return { isLoading, summary, operationsSummary, handleSelectFile };
};
