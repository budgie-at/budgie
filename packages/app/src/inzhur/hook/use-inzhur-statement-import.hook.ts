import { InzhurOperationsImportService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { NativeCallError } from '../../@generic/error/native-call.error';
import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { XLSX_MIME_TYPE } from '../../sync/constant/xlsx-mime-type.constant';

import type { InzhurOperationsImportSummaryInterface } from '@budgie/sync';

export const useInzhurStatementImport = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const [summary, setSummary] = useState<InzhurOperationsImportSummaryInterface | null>(null);

    const handleSelectFile = () =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.tryPromise({
                    try: () => DocumentPicker.getDocumentAsync({ type: XLSX_MIME_TYPE, copyToCacheDirectory: true }),
                    catch: cause => new NativeCallError({ cause })
                });
                const uri = result.assets?.at(0)?.uri;

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                setSummary(
                    yield* Effect.flatMap(InzhurOperationsImportService, inzhurOperationsImportService =>
                        inzhurOperationsImportService.importOperations(uri)
                    )
                );
            }).pipe(
                Effect.catchTags({
                    InzhurStatementInvalidError: () =>
                        Effect.sync(
                            () =>
                                void showErrorToast(
                                    t`Not an Inzhur export`,
                                    t`Choose the operations export (XLSX, «Виписка по операціям») from Inzhur`
                                )
                        ),
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

    return { isLoading, summary, handleSelectFile };
};
