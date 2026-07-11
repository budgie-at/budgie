import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useAccountSelection } from '../../hook/use-account-selection.hook';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { CreateFileBankAccountFooter } from '../create-file-bank-account-footer/create-file-bank-account-footer';
import { FileUploadStep } from '../file-upload-step/file-upload-step';

import { CreateFileBankAccountSelector } from './create-file-bank-account.selector';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config.interface';

type SetupStep = 'file' | 'accounts';

interface CreateFileBankAccountProps {
    readonly config: CreateFileBankAccountConfigInterface;
}

export const CreateFileBankAccount = ({ config }: CreateFileBankAccountProps) => {
    const { t } = useLingui();
    const [step, setStep] = useState<SetupStep>('file');
    const [isLoading, setIsLoading] = useState(false);
    const { accountPreviews, selectedAccounts, setPreviews, toggleAccount, selectAllAccounts, deselectAllAccounts } = useAccountSelection();
    const [fileUri, setFileUri] = useState<string | null>(null);

    const handleSelectFile = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: config.mimeType, copyToCacheDirectory: true });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            const previews = await config.importPreview(uri);
            setFileUri(uri);
            setPreviews(previews);
            setStep('accounts');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Invalid file`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupSync = async () => {
        if (!isDefined(fileUri)) {
            return;
        }

        setIsLoading(true);
        try {
            await config.executeImportForSelectedAccounts(fileUri, [...selectedAccounts]);
            router.replace('/');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Import failed`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const isFileStep = step === 'file';
    const hasSelectedAccounts = selectedAccounts.size > 0;
    const formStep = isFileStep ? (
        <FileUploadStep
            steps={config.steps}
            fileIcon={config.fileIcon}
            fileTypeLabel={config.fileTypeLabel}
            selectFileText={config.selectFileText}
            onSelectFile={handleSelectFile}
            isLoading={isLoading}
        />
    ) : (
        <AccountSelectionStep
            accountPreviews={accountPreviews}
            selectedAccounts={selectedAccounts}
            onToggle={toggleAccount}
            onSelectAll={selectAllAccounts}
            onDeselectAll={deselectAllAccounts}
        />
    );
    const footer = (
        <CreateFileBankAccountFooter
            isFileStep={isFileStep}
            isLoading={isLoading}
            hasSelectedAccounts={hasSelectedAccounts}
            onSelectFile={handleSelectFile}
            onSetupSync={handleSetupSync}
        />
    );

    return (
        <CollapsibleChromePage
            title={config.title}
            leading={<HeaderBackButton />}
            testID={CreateFileBankAccountSelector.ScrollView}
            footer={footer}
        >
            <FormLayoutGroup>{formStep}</FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
