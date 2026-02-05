/* jscpd:ignore-start */
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
/* jscpd:ignore-end */
import { PDF_MIME_TYPE } from '../../constant/pdf-mime-type.constant';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { ersteSyncExecuteImport, ersteSyncImportPreview } from '../../service/erste-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { FileUploadStep } from '../file-upload-step/file-upload-step';

type SetupStep = 'file' | 'accounts';

export const CreateErsteAccount = () => {
    const { t } = useLingui();

    /* jscpd:ignore-start */
    const [step, setStep] = useState<SetupStep>('file');
    const [isLoading, setIsLoading] = useState(false);
    const [accountPreviews, setAccountPreviews] = useState<BankAccountPreviewInterface[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
    const [filePath, setFilePath] = useState<string | null>(null);
    /* jscpd:ignore-end */

    const handleGoBack = () => void goBackOrReplace('/');

    /* jscpd:ignore-start */
    const handleSelectFile = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: PDF_MIME_TYPE, copyToCacheDirectory: true });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            const previews = await ersteSyncImportPreview(uri);
            setFilePath(uri);
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
        setSelectedAccounts(prev => {
            const next = new Set(prev);
            if (next.has(externalId)) {
                next.delete(externalId);
            } else {
                next.add(externalId);
            }

            return next;
        });
    };

    const handleSetupSync = async () => {
        if (!isDefined(filePath)) {
            return;
        }

        setIsLoading(true);
        try {
            await ersteSyncExecuteImport(filePath, [...selectedAccounts]);
            router.replace('/');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Import failed`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };
    /* jscpd:ignore-end */

    /* jscpd:ignore-start */
    return (
        <FullPage
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Import Erste Bank`}
                    description={t`Import accounts and transactions from Erste Bank PDF statement`}
                />
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    {step === 'file' && <FileUploadStep isLoading={isLoading} onSelectFile={handleSelectFile} />}

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
    /* jscpd:ignore-end */
};
