import { MonobankSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { DEFAULT_SYNC_HISTORY_DEPTH } from '../../constant/sync-history-depth-options.constant';
import { SetupStepEnum } from '../../enum/setup-step.enum';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';
import { SyncHistoryDepthStep } from '../sync-history-depth-step/sync-history-depth-step';
import { TokenInputStep } from '../token-input-step/token-input-step';

import { CreateMonobankAccountSelector } from './create-monobank-account.selector';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState(SetupStepEnum.TOKEN);
    const [token, setToken] = useState('');
    const [historyDepth, setHistoryDepth] = useState(DEFAULT_SYNC_HISTORY_DEPTH);

    const { accountSelection, isLoading, fetchAccountPreviews, handleGoBack, handleSetupSync, isStartSyncDisabled } =
        useSyncAccountSetupFlow(MonobankSyncService, (monobankSyncService, selectedAccountIds) =>
            monobankSyncService.setupAccountSyncBatch(token.trim(), selectedAccountIds, historyDepth)
        );

    const handleFetchAccounts = async () => {
        const trimmedToken = token.trim();

        if (!isNotEmptyString(trimmedToken)) {
            showErrorToast(t`Token required`, t`Please enter your Monobank API token`);

            return;
        }

        await fetchAccountPreviews(
            monobankSyncService => monobankSyncService.fetchAccountsPreview(trimmedToken),
            previews => {
                accountSelection.setPreviews(previews);
                setStep(SetupStepEnum.ACCOUNTS);
            }
        );
    };

    const previousStep: Record<SetupStepEnum, SetupStepEnum | null> = {
        [SetupStepEnum.TOKEN]: null,
        [SetupStepEnum.ACCOUNTS]: SetupStepEnum.TOKEN,
        [SetupStepEnum.HISTORY]: SetupStepEnum.ACCOUNTS
    };

    const handleStepAwareGoBack = () => {
        const stepBefore = previousStep[step];

        if (!isDefined(stepBefore)) {
            handleGoBack();

            return;
        }

        setStep(stepBefore);
    };

    const handleContinueToHistory = () => {
        setStep(SetupStepEnum.HISTORY);
    };

    let stepContent = <TokenInputStep token={token} onTokenChange={setToken} />;
    let footer = <Button onPress={handleFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />;

    switch (step) {
        case SetupStepEnum.ACCOUNTS:
            stepContent = <AccountSelectionStep {...accountSelection} />;
            footer = (
                <Button
                    onPress={handleContinueToHistory}
                    disabled={isStartSyncDisabled}
                    content={t`Continue`}
                    testID={CreateMonobankAccountSelector.ContinueButton}
                />
            );
            break;
        case SetupStepEnum.HISTORY:
            stepContent = <SyncHistoryDepthStep selectedDepth={historyDepth} onSelect={setHistoryDepth} />;
            footer = <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />;
            break;
        default:
            break;
    }

    return (
        <SyncAccountSetupPage
            title={t`Connect Monobank`}
            description={t`Sync your Monobank accounts and transactions`}
            onGoBack={handleStepAwareGoBack}
            footer={footer}
            scrollViewTestID={CreateMonobankAccountSelector.ScrollView}
        >
            {stepContent}
        </SyncAccountSetupPage>
    );
};
