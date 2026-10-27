import { BinanceSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { SetupStepEnum } from '../../enum/setup-step.enum';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { BinanceParkedAssetsNotice } from '../binance-parked-assets-notice/binance-parked-assets-notice';
import { KeySecretInputStep } from '../key-secret-input-step/key-secret-input-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';

import { CreateBinanceAccountSelector } from './create-binance-account.selector';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

export const CreateBinanceAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState(SetupStepEnum.TOKEN);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [parkedPreviews, setParkedPreviews] = useState<SyncAccountPreviewInterface[]>([]);

    const buildToken = () => JSON.stringify({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() });

    const { accountSelection, isLoading, fetchAccountPreviews, handleGoBack, handleSetupSync, isStartSyncDisabled } =
        useSyncAccountSetupFlow(BinanceSyncService, (binanceSyncService, selectedAccountIds) =>
            binanceSyncService.setupAccountSyncBatch(buildToken(), selectedAccountIds)
        );

    const handleFetchAccounts = () => {
        if (!isNotEmptyString(apiKey.trim()) || !isNotEmptyString(apiSecret.trim())) {
            showErrorToast(t`Credentials required`, t`Please enter your Binance API key and secret`);

            return;
        }

        void fetchAccountPreviews(
            binanceSyncService => binanceSyncService.fetchAccountsPreview(buildToken()),
            previews => {
                accountSelection.setPreviews(previews.filter(preview => !preview.isParked));
                setParkedPreviews(previews.filter(preview => preview.isParked));
                setStep(SetupStepEnum.ACCOUNTS);
            }
        );
    };

    let pageContent = (
        <>
            <AccountSelectionStep {...accountSelection} />
            <BinanceParkedAssetsNotice parkedPreviews={parkedPreviews} />
        </>
    );
    let footer = <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />;

    if (step === SetupStepEnum.TOKEN) {
        pageContent = (
            <KeySecretInputStep apiKey={apiKey} apiSecret={apiSecret} onApiKeyChange={setApiKey} onApiSecretChange={setApiSecret} />
        );
        footer = <Button onPress={handleFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />;
    }

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
