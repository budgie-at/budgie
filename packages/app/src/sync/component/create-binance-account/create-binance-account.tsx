import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useAccountSelection } from '../../hook/use-account-selection.hook';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { binanceSyncService } from '../../service/binance-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { BinanceParkedAssetsNotice } from '../binance-parked-assets-notice/binance-parked-assets-notice';
import { KeySecretInputStep } from '../key-secret-input-step/key-secret-input-step';

import { CreateBinanceAccountSelector } from './create-binance-account.selector';

import type { Edge } from 'react-native-safe-area-context';

type SetupStep = 'credentials' | 'accounts';
const FORM_PAGE_SAFE_EDGES: Edge[] = ['bottom', 'top'];

export const CreateBinanceAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('credentials');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parkedPreviews, setParkedPreviews] = useState<BankAccountPreviewInterface[]>([]);
    const { accountPreviews, selectedAccounts, setPreviews, toggleAccount, selectAllAccounts, deselectAllAccounts } = useAccountSelection();

    const handleGoBack = () => void goBackOrReplace('/');

    const buildToken = () => JSON.stringify({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() });

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

    const handleSetupSync = async () => {
        setIsLoading(true);
        try {
            await binanceSyncService.setupAccountSyncBatch(buildToken(), [...selectedAccounts]);
            router.replace('/');
        } catch (error) {
            showErrorToast(t`Could not set up sync`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isStartSyncDisabled = isLoading || selectedAccounts.size === 0;
    const footer =
        step === 'credentials' ? (
            <Button onPress={handleFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />
        ) : (
            <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />
        );

    return (
        <FormPage
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Connect Binance`}
                    description={t`Sync your Binance balances and transactions`}
                />
            }
            footer={footer}
            safeEdges={FORM_PAGE_SAFE_EDGES}
            scrollViewTestID={CreateBinanceAccountSelector.ScrollView}
        >
            <FormLayoutGroup>
                {step === 'credentials' && (
                    <KeySecretInputStep apiKey={apiKey} apiSecret={apiSecret} onApiKeyChange={setApiKey} onApiSecretChange={setApiSecret} />
                )}

                {step === 'accounts' && (
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
                )}
            </FormLayoutGroup>
        </FormPage>
    );
};
