import { ExternalSourceEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useReducer } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { CreateBinanceAccountActionTypeEnum } from '../../enum/create-binance-account-action-type.enum';
import { SetupStepEnum } from '../../enum/setup-step.enum';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { createBinanceAccountReducer } from '../../utils/create-binance-account-reducer.util';
import { toastBinanceKeyPermissionsError } from '../../utils/toast-binance-key-permissions-error.util';
import { KeySecretInputStep } from '../key-secret-input-step/key-secret-input-step';
import { SyncAccountsStep } from '../sync-accounts-step/sync-accounts-step';
import { SyncParkedAccountsSection } from '../sync-parked-accounts-section/sync-parked-accounts-section';
import { SyncSetupPage } from '../sync-setup-page/sync-setup-page';

import { CreateBinanceAccountSelector } from './create-binance-account.selector';

export const CreateBinanceAccount = () => {
    const { t } = useLingui();

    const [{ step, apiKey, apiSecret, parkedPreviews }, dispatch] = useReducer(createBinanceAccountReducer, {
        step: SetupStepEnum.TOKEN,
        apiKey: '',
        apiSecret: '',
        parkedPreviews: []
    });

    const handleApiKeyChange = (value: string) => {
        dispatch({ type: CreateBinanceAccountActionTypeEnum.API_KEY_CHANGED, apiKey: value });
    };

    const handleApiSecretChange = (value: string) => {
        dispatch({ type: CreateBinanceAccountActionTypeEnum.API_SECRET_CHANGED, apiSecret: value });
    };

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
            binanceSyncService =>
                binanceSyncService
                    .fetchAccountsPreview(buildToken())
                    .pipe(
                        Effect.catchTags({ BinanceKeyPermissionsError: error => Effect.as(toastBinanceKeyPermissionsError(error), null) })
                    ),
            previews => {
                accountSelection.setPreviews(previews.filter(preview => !preview.isParked));
                dispatch({
                    type: CreateBinanceAccountActionTypeEnum.ACCOUNTS_FETCHED,
                    parkedPreviews: previews.filter(preview => preview.isParked)
                });
            }
        );
    };

    let pageContent = (
        <>
            <SyncAccountsStep
                {...accountSelection}
                logo={<BankLogo bankProvider={ExternalSourceEnum.BINANCE} size={36} />}
                footer={t`Choose what to track. Balances and history come straight from Binance.`}
                emptyDescription={t`Binance returned no assets for this key.`}
            />
            <SyncParkedAccountsSection
                previews={parkedPreviews}
                footer={t`Binance has no market price for these assets, so they are not added as accounts and are skipped from your balance.`}
            />
        </>
    );
    let footer = (
        <PillButton
            label={t`Start sync`}
            onPress={handleSetupSync}
            isDisabled={isStartSyncDisabled}
            testID={CreateBinanceAccountSelector.StartSyncButton}
        />
    );
    let description = '';

    if (step === SetupStepEnum.TOKEN) {
        pageContent = (
            <KeySecretInputStep
                apiKey={apiKey}
                apiSecret={apiSecret}
                onApiKeyChange={handleApiKeyChange}
                onApiSecretChange={handleApiSecretChange}
            />
        );
        footer = (
            <PillButton
                label={t`Fetch accounts`}
                onPress={handleFetchAccounts}
                isDisabled={isLoading}
                isLoading={isLoading}
                testID={CreateBinanceAccountSelector.FetchAccountsButton}
            />
        );
        description = t`Sync your Binance balances and transactions`;
    }

    return (
        <SyncSetupPage
            title={t`Connect Binance`}
            description={description}
            onGoBack={handleGoBack}
            footerButton={footer}
            testID={CreateBinanceAccountSelector.ScrollView}
        >
            {pageContent}
        </SyncSetupPage>
    );
};
