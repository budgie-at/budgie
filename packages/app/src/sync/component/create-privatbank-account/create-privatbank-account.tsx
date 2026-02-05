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
import { XLSX_MIME_TYPE } from '../../constant/xlsx-mime-type.constant';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { privatbankSyncExecuteImport, privatbankSyncImportPreview } from '../../service/privatbank-sync.service';
import { readFileAsUint8Array } from '../../util/read-file-as-uint8-array.util';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { FileUploadStep } from '../file-upload-step/file-upload-step';

type SetupStep = 'file' | 'accounts';

// eslint-disable-next-line max-lines-per-function -- Form orchestration component
export const CreatePrivatbankAccount = () => {
    const { t } = useLingui();

    /* jscpd:ignore-start */
    const [step, setStep] = useState<SetupStep>('file');
    const [isLoading, setIsLoading] = useState(false);
    const [accountPreviews, setAccountPreviews] = useState<BankAccountPreviewInterface[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
    const [fileBuffer, setFileBuffer] = useState<Uint8Array | null>(null);
    /* jscpd:ignore-end */

    const handleGoBack = () => void goBackOrReplace('/');

    const handleSelectFile = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: XLSX_MIME_TYPE, copyToCacheDirectory: true });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            const buffer = await readFileAsUint8Array(uri);
            const previews = await privatbankSyncImportPreview(buffer);
            setFileBuffer(buffer);
            setAccountPreviews(previews);
            setSelectedAccounts(new Set(previews.filter(preview => preview.hasBankSync).map(preview => preview.externalId)));
            setStep('accounts');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Invalid file`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    /* jscpd:ignore-start */
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
        if (!isDefined(fileBuffer)) {
            return;
        }

        setIsLoading(true);
        try {
            await privatbankSyncExecuteImport(fileBuffer, [...selectedAccounts]);
            router.replace('/');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Import failed`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };
    /* jscpd:ignore-end */

    return (
        <FullPage
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Import Privatbank`}
                    description={t`Import accounts and transactions from Privatbank XLSX export`}
                />
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    {step === 'file' && (
                        <FileUploadStep
                            isLoading={isLoading}
                            onSelectFile={handleSelectFile}
                            instructionText={t`Export your transactions as XLSX from the Privatbank24 app: Menu → Statements → Export to Excel.`}
                            selectFileText={t`Select the exported XLSX file:`}
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
