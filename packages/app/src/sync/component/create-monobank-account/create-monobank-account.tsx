import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { SyncHistoryDepthEnum } from '../../enum/sync-history-depth.enum';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';
import { SyncHistoryDepthStep } from '../sync-history-depth-step/sync-history-depth-step';
import { TokenInputStep } from '../token-input-step/token-input-step';

import { CreateMonobankAccountSelector } from './create-monobank-account.selector';

import type { ReactNode } from 'react';

type SetupStep = 'token' | 'accounts' | 'history';

// eslint-disable-next-line max-lines-per-function, max-statements -- Multi-step setup orchestration with per-step content and footer
export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('token');
    const [token, setToken] = useState('');
    const [historyDepth, setHistoryDepth] = useState(SyncHistoryDepthEnum.MONTHS_3);

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
    } = useSyncAccountSetupFlow(selectedAccountIds =>
        monobankSyncService.setupAccountSyncBatch(token.trim(), selectedAccountIds, historyDepth)
    );

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

    const handleContinueToHistory = () => {
        setStep('history');
    };

    const handleStepAwareGoBack = () => {
        if (step === 'history') {
            setStep('accounts');

            return;
        }

        if (step === 'accounts') {
            setStep('token');

            return;
        }

        handleGoBack();
    };

    const tokenStepContent = <TokenInputStep token={token} onTokenChange={setToken} />;
    const accountsStepContent = (
        <AccountSelectionStep
            accountPreviews={accountPreviews}
            selectedAccounts={selectedAccounts}
            onToggle={toggleAccount}
            onSelectAll={selectAllAccounts}
            onDeselectAll={deselectAllAccounts}
        />
    );
    const historyStepContent = <SyncHistoryDepthStep selectedDepth={historyDepth} onSelect={setHistoryDepth} />;

    const stepContentByStep: Record<SetupStep, ReactNode> = {
        token: tokenStepContent,
        accounts: accountsStepContent,
        history: historyStepContent
    };

    const tokenFooter = <Button onPress={handleFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />;
    const accountsFooter = (
        <Button
            onPress={handleContinueToHistory}
            disabled={isStartSyncDisabled}
            content={t`Continue`}
            testID={CreateMonobankAccountSelector.ContinueButton}
        />
    );
    const historyFooter = <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />;

    const footerByStep: Record<SetupStep, ReactNode> = {
        token: tokenFooter,
        accounts: accountsFooter,
        history: historyFooter
    };

    return (
        <SyncAccountSetupPage
            title={t`Connect Monobank`}
            description={t`Sync your Monobank accounts and transactions`}
            onGoBack={handleStepAwareGoBack}
            footer={footerByStep[step]}
            scrollViewTestID={CreateMonobankAccountSelector.ScrollView}
        >
            {stepContentByStep[step]}
        </SyncAccountSetupPage>
    );
};
