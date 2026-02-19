import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { toggleSetItem } from '../../util/toggle-set-item.util';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { FileUploadStep } from '../file-upload-step/file-upload-step';

import type { CreateFileBankAccountConfigInterface } from '../../interface/create-file-bank-account-config.interface';

type SetupStep = 'file' | 'accounts';

interface CreateFileBankAccountProps {
    readonly config: CreateFileBankAccountConfigInterface;
}

export const CreateFileBankAccount = ({ config }: CreateFileBankAccountProps) => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('file');
    const [isLoading, setIsLoading] = useState(false);
    const [accountPreviews, setAccountPreviews] = useState<BankAccountPreviewInterface[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
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
            setAccountPreviews(previews);
            setSelectedAccounts(new Set(previews.filter(preview => preview.hasBankSync).map(preview => preview.externalId)));
            setStep('accounts');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Invalid file`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAccountSelection = (externalId: string) => {
        setSelectedAccounts(prev => toggleSetItem(prev, externalId));
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

    return (
        <FullPage header={<PageHeader onGoBack={handleGoBack} title={config.title} description={config.description} />}>
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    {step === 'file' && (
                        <FileUploadStep
                            isLoading={isLoading}
                            onSelectFile={handleSelectFile}
                            instructionText={config.instructionText}
                            selectFileText={config.selectFileText}
                        />
                    )}

                    {step === 'accounts' && (
                        <AccountSelectionStep
                            accountPreviews={accountPreviews}
                            selectedAccounts={selectedAccounts}
                            isLoading={isLoading}
                            onToggle={handleToggleAccountSelection}
                            onSetupSync={handleSetupSync}
                        />
                    )}
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </FullPage>
    );
};
