import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { SyncAccountPreviewInterface } from '../../interface/sync-account-preview.interface';
import { binanceSyncService } from '../../service/binance-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { BinanceParkedAssetsNotice } from '../binance-parked-assets-notice/binance-parked-assets-notice';
import { KeySecretInputStep } from '../key-secret-input-step/key-secret-input-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';

import { CreateBinanceAccountSelector } from './create-binance-account.selector';

type SetupStep = 'credentials' | 'accounts';

export const CreateBinanceAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('credentials');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [parkedPreviews, setParkedPreviews] = useState<SyncAccountPreviewInterface[]>([]);

    const buildToken = () => JSON.stringify({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() });

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
    } = useSyncAccountSetupFlow(selectedAccountIds => binanceSyncService.setupAccountSyncBatch(buildToken(), selectedAccountIds));

    const handleFetchAccounts = async () => {
        if (!isNotEmptyString(apiKey.trim()) || !isNotEmptyString(apiSecret.trim())) {
            showErrorToast(t`Credentials required`, t`Please enter your Binance API key and secret`);

            return;
        }

        setIsLoading(true);
        try {
            const previews = await binanceSyncService.fetchAccountsPreview(buildToken());
            setPreviews(previews.filter(preview => !preview.isParked));
            setParkedPreviews(previews.filter(preview => preview.isParked));
            setStep('accounts');
        } catch (error) {
            showErrorToast(t`Could not fetch accounts`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isInputStep = step === 'credentials';
    const inputStepContent = (
        <KeySecretInputStep apiKey={apiKey} apiSecret={apiSecret} onApiKeyChange={setApiKey} onApiSecretChange={setApiSecret} />
    );
    const accountsStepContent = (
        <>
            <AccountSelectionStep
                accountPreviews={accountPreviews}
                selectedAccounts={selectedAccounts}
                onToggle={toggleAccount}
                onSelectAll={selectAllAccounts}
                onDeselectAll={deselectAllAccounts}
            />

            <BinanceParkedAssetsNotice parkedPreviews={parkedPreviews} />
        </>
    );
    const footerAction = isInputStep ? handleFetchAccounts : handleSetupSync;
    const footerDisabled = isInputStep ? isLoading : isStartSyncDisabled;
    const footerContent = isInputStep ? t`Fetch Accounts` : t`Start Sync`;
    const footer = <Button onPress={footerAction} disabled={footerDisabled} content={footerContent} />;
    const pageContent = isInputStep ? inputStepContent : accountsStepContent;

    return (
        <SyncAccountSetupPage
            title={t`Connect Binance`}
            description={t`Sync your Binance balances and transactions`}
            onGoBack={handleGoBack}
            footer={footer}
            scrollViewTestID={CreateBinanceAccountSelector.ScrollView}
        >
            {pageContent}
        </SyncAccountSetupPage>
    );
};
