import { UserIconNameEnum } from '@budgie/contracts';
import { InzhurImportService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { FileUploadStep } from '../../../sync/component/file-upload-step/file-upload-step';
import { PDF_MIME_TYPE } from '../../../sync/constant/pdf-mime-type.constant';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurImportSummary } from '../inzhur-import-summary/inzhur-import-summary';

import type { InzhurImportSummaryInterface } from '@budgie/sync';

export const ImportInzhurStatement = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const [summary, setSummary] = useState<InzhurImportSummaryInterface | null>(null);

    const handleSelectFile = () =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.promise(() =>
                    DocumentPicker.getDocumentAsync({ type: PDF_MIME_TYPE, copyToCacheDirectory: true })
                );
                const uri = result.assets?.at(0)?.uri;

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                setSummary(yield* Effect.flatMap(InzhurImportService, inzhurImportService => inzhurImportService.importStatement(uri)));
            }).pipe(
                Effect.catchTags({
                    InzhurStatementInvalidError: () =>
                        Effect.sync(
                            () =>
                                void showErrorToast(t`Not an Inzhur statement`, t`Choose the securities account statement PDF from Inzhur`)
                        ),
                    InzhurNotSetUpError: () =>
                        Effect.sync(() => void showErrorToast(t`Inzhur is not set up`, t`Add Inzhur first, then import a statement`))
                }),
                toastOnFailure(t`Import failed`)
            )
        );

    const exportSteps = [t`Open the Inzhur app`, t`Request the statement of your securities account`, t`Save the statement as a PDF`];

    const handleDone = () => void router.dismissTo('/');

    const footer = isDefined(summary) ? (
        <PillButtonFooter label={t`Done`} testID={InzhurSelector.DoneButton} onPress={handleDone} />
    ) : (
        <PillButtonFooter
            label={t`Select File`}
            isLoading={isLoading}
            testID={InzhurSelector.SelectFileButton}
            onPress={handleSelectFile}
        />
    );
    const content = isDefined(summary) ? (
        <InzhurImportSummary summary={summary} />
    ) : (
        <FileUploadStep
            steps={exportSteps}
            fileIcon={UserIconNameEnum.FileText}
            fileTypeLabel={t`PDF statement`}
            selectFileText={t`Select the downloaded PDF file`}
            onSelectFile={handleSelectFile}
            isLoading={isLoading}
        />
    );

    return (
        <CollapsibleChromePage
            title={t`Import Inzhur statement`}
            subtitle={t`Update your fund certificates from the depository statement`}
            leading={<HeaderBackButton />}
            testID={InzhurSelector.ImportPage}
            footer={footer}
        >
            <FormLayoutGroup>{content}</FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
