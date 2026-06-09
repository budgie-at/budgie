import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useBankAccountSetupFlow } from '../../hook/use-bank-account-setup-flow.hook';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { binanceSyncService } from '../../service/binance-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { BankAccountSetupPage } from '../bank-account-setup-page/bank-account-setup-page';
import { BinanceParkedAssetsNotice } from '../binance-parked-assets-notice/binance-parked-assets-notice';
import { KeySecretInputStep } from '../key-secret-input-step/key-secret-input-step';

import { CreateBinanceAccountSelector } from './create-binance-account.selector';

type SetupStep = 'credentials' | 'accounts';

export const CreateBinanceAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('credentials');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [parkedPreviews, setParkedPreviews] = useState<BankAccountPreviewInterface[]>([]);

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
    } = useBankAccountSetupFlow(selectedAccountIds => binanceSyncService.setupAccountSyncBatch(buildToken(), selectedAccountIds));

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

    return (
        <BankAccountSetupPage
            onGoBack={handleGoBack}
            title={t`Connect Binance`}
            description={t`Sync your Binance balances and transactions`}
            scrollViewTestID={CreateBinanceAccountSelector.ScrollView}
            isInputStep={isInputStep}
            isLoading={isLoading}
            isStartSyncDisabled={isStartSyncDisabled}
            onFetchAccounts={handleFetchAccounts}
            onSetupSync={handleSetupSync}
            inputStepContent={inputStepContent}
            accountsStepContent={accountsStepContent}
        />
    );
};
