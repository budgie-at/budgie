import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAccountSelection } from '../../hook/use-account-selection.hook';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { FileUploadStep } from '../file-upload-step/file-upload-step';

import { CreateFileBankAccountSelector } from './create-file-bank-account.selector';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config.interface';
import type { Edge } from 'react-native-safe-area-context';

type SetupStep = 'file' | 'accounts';
const FORM_PAGE_SAFE_EDGES: Edge[] = ['bottom', 'top'];

interface CreateFileBankAccountProps {
    readonly config: CreateFileBankAccountConfigInterface;
}

export const CreateFileBankAccount = ({ config }: CreateFileBankAccountProps) => {
    const { t } = useLingui();
    const [step, setStep] = useState<SetupStep>('file');
    const [isLoading, setIsLoading] = useState(false);
    const { accountPreviews, selectedAccounts, setPreviews, toggleAccount, selectAllAccounts, deselectAllAccounts } = useAccountSelection();
    const [fileUri, setFileUri] = useState<string | null>(null);
    const handleGoBack = () => void goBackOrReplace('/');
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
    const footerProps = isFileStep
        ? {
              onPress: handleSelectFile,
              disabled: isLoading,
              content: t`Select File`,
              leftIcon: UserIconNameEnum.Upload,
              testID: CreateFileBankAccountSelector.SelectFileButton
          }
        : {
              onPress: handleSetupSync,
              disabled: isLoading || selectedAccounts.size === 0,
              content: t`Start Sync`,
              testID: CreateFileBankAccountSelector.StartSyncButton
          };
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

    return (
        <FormPage
            header={<PageHeader onGoBack={handleGoBack} title={config.title} description={config.description} />}
            footer={<Button {...footerProps} />}
            safeEdges={FORM_PAGE_SAFE_EDGES}
            scrollViewTestID={CreateFileBankAccountSelector.ScrollView}
        >
            <FormLayoutGroup>{formStep}</FormLayoutGroup>
        </FormPage>
    );
};
