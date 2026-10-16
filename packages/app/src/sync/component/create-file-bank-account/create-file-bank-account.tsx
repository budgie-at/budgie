import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { ReactElement, useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
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
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<Pick<DocumentPicker.DocumentPickerAsset, 'name' | 'uri'> | null>(null);
    const [review, setReview] = useState<FileBankSyncImportReviewInterface | null>(null);
    const accountSelection = useAccountSelection();
    const { selectedAccounts, setPreviews } = accountSelection;
    const onboardingHref = useOnboardingRedirect();

    const runStep = async (errorTitle: string, action: () => Promise<void>) => {
        setIsLoading(true);
        try {
            await action();
        } catch (error) {
            Toast.show({ type: 'error', text1: errorTitle, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectFile = () =>
        runStep(t`Invalid file`, async () => {
            const result = await DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true });
            const asset = result.assets?.at(0);

            if (result.canceled || !isDefined(asset) || !isNotEmptyString(asset.uri)) {
                return;
            }

            setPreviews(await config.importPreview(asset.uri));
            setSelectedFile(asset);
            setStep(FileImportStepEnum.ACCOUNTS);
        });

    const handleReview = () =>
        runStep(t`Invalid file`, async () => {
            if (isDefined(selectedFile)) {
                setReview(await config.reviewImport(selectedFile.uri, [...selectedAccounts]));
                setStep(FileImportStepEnum.REVIEW);
            }
        });

    const handleImport = () =>
        runStep(t`Import failed`, async () => {
            if (isDefined(selectedFile)) {
                await config.executeImportForSelectedAccounts(selectedFile.uri, [...selectedAccounts]);
                router.replace(onboardingHref ?? '/');
            }
        });

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
