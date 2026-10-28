import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { ReactElement, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useOnboardingRedirect } from '../../../onboarding/hook/use-onboarding-redirect.hook';
import { FileImportStepEnum } from '../../enum/file-import-step.enum';
import { useAccountSelection } from '../../hook/use-account-selection.hook';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { CreateFileBankAccountFooter } from '../create-file-bank-account-footer/create-file-bank-account-footer';
import { FileImportReviewStep } from '../file-import-review-step/file-import-review-step';
import { FileUploadStep } from '../file-upload-step/file-upload-step';

import { CreateFileBankAccountSelector } from './create-file-bank-account.selector';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config.interface';
import type { FileBankSyncImportReviewInterface } from '@budgie/sync';

interface CreateFileBankAccountProps {
    readonly config: CreateFileBankAccountConfigInterface;
}

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const CreateFileBankAccount = ({ config }: CreateFileBankAccountProps) => {
    const { t } = useLingui();
    const [step, setStep] = useState(FileImportStepEnum.FILE);
    const { isLoading, run } = useSingleFlight();
    const [selectedFile, setSelectedFile] = useState<Pick<DocumentPicker.DocumentPickerAsset, 'name' | 'uri'> | null>(null);
    const [review, setReview] = useState<FileBankSyncImportReviewInterface | null>(null);
    const accountSelection = useAccountSelection();
    const { selectedAccounts, setPreviews } = accountSelection;
    const onboardingHref = useOnboardingRedirect();

    const handleSelectFile = () =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.promise(() =>
                    DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true })
                );
                const asset = result.assets?.at(0);

                if (result.canceled || !isDefined(asset) || !isNotEmptyString(asset.uri)) {
                    return;
                }

                setPreviews(yield* config.importPreview(asset.uri));
                setSelectedFile(asset);
                setStep(FileImportStepEnum.ACCOUNTS);
            }).pipe(toastOnFailure(t`Invalid file`))
        );

    const handleReview = () =>
        run(
            Effect.gen(function* () {
                if (isDefined(selectedFile)) {
                    setReview(yield* config.reviewImport(selectedFile.uri, [...selectedAccounts]));
                    setStep(FileImportStepEnum.REVIEW);
                }
            }).pipe(toastOnFailure(t`Invalid file`))
        );

    const handleImport = () =>
        run(
            Effect.gen(function* () {
                if (isDefined(selectedFile)) {
                    yield* config.executeImportForSelectedAccounts(selectedFile.uri, [...selectedAccounts]);
                    router.dismissTo(onboardingHref ?? '/');
                }
            }).pipe(toastOnFailure(t`Import failed`))
        );

    const newTransactionCount = isDefined(review) ? review.parsedTransactionCount - review.duplicateTransactionCount : 0;
    const importLabel = t({ message: plural(newTransactionCount, { one: 'Import # transaction', other: 'Import # transactions' }) });
    const fileName = selectedFile?.name ?? '';
    const hasSelectedAccounts = selectedAccounts.size > 0;
    const stepContent: Record<FileImportStepEnum, ReactElement | null> = {
        [FileImportStepEnum.FILE]: (
            <FileUploadStep
                steps={config.steps}
                fileIcon={config.fileIcon}
                fileTypeLabel={config.fileTypeLabel}
                selectFileText={config.selectFileText}
                onSelectFile={handleSelectFile}
                isLoading={isLoading}
            />
        ),
        [FileImportStepEnum.ACCOUNTS]: <AccountSelectionStep {...accountSelection} />,
        [FileImportStepEnum.REVIEW]: isDefined(review) ? <FileImportReviewStep review={review} fileName={fileName} /> : null
    };
    const footer = (
        <CreateFileBankAccountFooter
            step={step}
            isLoading={isLoading}
            hasSelectedAccounts={hasSelectedAccounts}
            importLabel={importLabel}
            onSelectFile={handleSelectFile}
            onReview={handleReview}
            onImport={handleImport}
        />
    );

    return (
        <CollapsibleChromePage
            title={config.title}
            subtitle={config.description}
            leading={<HeaderBackButton />}
            testID={CreateFileBankAccountSelector.ScrollView}
            footer={footer}
        >
            <FormLayoutGroup>{stepContent[step]}</FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
