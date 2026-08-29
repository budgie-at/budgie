import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';
import { TokenInputStep } from '../token-input-step/token-input-step';

import { CreateMonobankAccountSelector } from './create-monobank-account.selector';

type SetupStep = 'token' | 'accounts';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('token');
    const [token, setToken] = useState('');

    const {
        accountPreviews,
        selectedAccounts,
        setPreviews,
        toggleAccount,
        selectAllAccounts,
        deselectAllAccounts,
        isLoading,
        setIsLoading,
        handleGoBack,
        handleSetupSync,
        isStartSyncDisabled
    } = useSyncAccountSetupFlow(selectedAccountIds => monobankSyncService.setupAccountSyncBatch(token.trim(), selectedAccountIds));

    const handleFetchAccounts = async () => {
        const trimmedToken = token.trim();

        if (!isNotEmptyString(trimmedToken)) {
            showErrorToast(t`Token required`, t`Please enter your Monobank API token`);

            return;
        }

        setIsLoading(true);
        try {
            const previews = await monobankSyncService.fetchAccountsPreview(trimmedToken);
            setPreviews(previews);
            setStep('accounts');
        } catch (error) {
            showErrorToast(t`Could not fetch accounts`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isInputStep = step === 'token';
    const inputStepContent = <TokenInputStep token={token} onTokenChange={setToken} />;
    const accountsStepContent = (
        <AccountSelectionStep
            accountPreviews={accountPreviews}
            selectedAccounts={selectedAccounts}
            onToggle={toggleAccount}
            onSelectAll={selectAllAccounts}
            onDeselectAll={deselectAllAccounts}
        />
    );
    const footer = isInputStep ? (
        <Button onPress={handleFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />
    ) : (
        <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />
    );

    return (
        <SyncAccountSetupPage
            title={t`Connect Monobank`}
            description={t`Sync your Monobank accounts and transactions`}
            onGoBack={handleGoBack}
            footer={footer}
            scrollViewTestID={CreateMonobankAccountSelector.ScrollView}
        >
            {isInputStep ? inputStepContent : accountsStepContent}
        </SyncAccountSetupPage>
    );
};
