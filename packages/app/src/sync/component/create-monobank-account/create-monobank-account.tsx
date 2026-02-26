import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { toggleSetItem } from '../../util/toggle-set-item.util';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { TokenInputStep } from '../token-input-step/token-input-step';

type SetupStep = 'token' | 'accounts';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('token');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [accountPreviews, setAccountPreviews] = useState<BankAccountPreviewInterface[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

    const handleGoBack = () => void goBackOrReplace('/');

    const handleFetchAccounts = async () => {
        const trimmedToken = token.trim();

        if (!isNotEmptyString(trimmedToken)) {
            Toast.show({ type: 'error', text1: t`Token required`, text2: t`Please enter your Monobank API token` });

            return;
        }

        setIsLoading(true);
        try {
            const previews = await monobankSyncService.fetchAccountsPreview(trimmedToken);
            setAccountPreviews(previews);
            setSelectedAccounts(new Set(previews.filter(acc => acc.hasBankSync).map(acc => acc.externalId)));
            setStep('accounts');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Failed to fetch accounts`, text2: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAccountSelection = (externalId: string) => {
        setSelectedAccounts(prev => toggleSetItem(prev, externalId));
    };

    const handleSetupSync = async () => {
        setIsLoading(true);
        try {
            await monobankSyncService.setupAccountSyncBatch(token.trim(), [...selectedAccounts]);
            router.replace('/');
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Failed to setup sync`, text2: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FullPage
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Connect Monobank`}
                    description={t`Sync your Monobank accounts and transactions`}
                />
            }
        >
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <FormLayoutGroup>
                    {step === 'token' && (
                        <TokenInputStep
                            token={token}
                            isLoading={isLoading}
                            onTokenChange={setToken}
                            onFetchAccounts={handleFetchAccounts}
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
