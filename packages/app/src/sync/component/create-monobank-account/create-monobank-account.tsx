import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useAccountSelection } from '../../hook/use-account-selection.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { TokenInputStep } from '../token-input-step/token-input-step';

import { CreateMonobankAccountSelector } from './create-monobank-account.selector';

type SetupStep = 'token' | 'accounts';

export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const [step, setStep] = useState<SetupStep>('token');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { accountPreviews, selectedAccounts, setPreviews, toggleAccount, selectAllAccounts, deselectAllAccounts } = useAccountSelection();

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

    const handleSetupSync = async () => {
        setIsLoading(true);
        try {
            await monobankSyncService.setupAccountSyncBatch(token.trim(), [...selectedAccounts]);
            router.replace('/');
        } catch (error) {
            showErrorToast(t`Could not set up sync`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isStartSyncDisabled = isLoading || selectedAccounts.size === 0;
    const footer =
        step === 'token' ? (
            <Button
                onPress={handleFetchAccounts}
                disabled={isLoading}
                content={t`Fetch Accounts`}
                testID={CreateMonobankAccountSelector.FetchAccountsButton}
            />
        ) : (
            <Button
                onPress={handleSetupSync}
                disabled={isStartSyncDisabled}
                content={t`Start Sync`}
                testID={CreateMonobankAccountSelector.StartSyncButton}
            />
        );

    return (
        <CollapsibleChromePage
            title={t`Connect Monobank`}
            leading={<HeaderBackButton />}
            testID={CreateMonobankAccountSelector.ScrollView}
            footer={<View className="gap-md pt-xl px-7xl">{footer}</View>}
        >
            <FormLayoutGroup>
                {step === 'token' && <TokenInputStep token={token} onTokenChange={setToken} />}

                {step === 'accounts' && (
                    <AccountSelectionStep
                        accountPreviews={accountPreviews}
                        selectedAccounts={selectedAccounts}
                        onToggle={toggleAccount}
                        onSelectAll={selectAllAccounts}
                        onDeselectAll={deselectAllAccounts}
                    />
                )}
            </FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
