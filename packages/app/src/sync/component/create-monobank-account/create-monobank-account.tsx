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
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { toggleSetItem } from '../../util/toggle-set-item.util';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { TokenInputStep } from '../token-input-step/token-input-step';

import { CreateMonobankAccountSelector } from './create-monobank-account.selector';

import type { Edge } from 'react-native-safe-area-context';

type SetupStep = 'token' | 'accounts';
const FORM_PAGE_SAFE_EDGES: Edge[] = ['bottom', 'top'];

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
            showErrorToast(t`Token required`, t`Please enter your Monobank API token`);

            return;
        }

        setIsLoading(true);
        try {
            const previews = await monobankSyncService.fetchAccountsPreview(trimmedToken);
            setAccountPreviews(previews);
            setSelectedAccounts(new Set(previews.filter(acc => acc.hasBankSync).map(acc => acc.externalId)));
            setStep('accounts');
        } catch (error) {
            showErrorToast(t`Could not fetch accounts`, getErrorMessage(error));
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
            showErrorToast(t`Could not set up sync`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isStartSyncDisabled = isLoading || selectedAccounts.size === 0;
    const footer =
        step === 'token' ? (
            <Button onPress={handleFetchAccounts} disabled={isLoading} content={t`Fetch Accounts`} />
        ) : (
            <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />
        );

    return (
        <FormPage
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Connect Monobank`}
                    description={t`Sync your Monobank accounts and transactions`}
                />
            }
            footer={footer}
            safeEdges={FORM_PAGE_SAFE_EDGES}
            scrollViewTestID={CreateMonobankAccountSelector.ScrollView}
        >
            <FormLayoutGroup>
                {step === 'token' && <TokenInputStep token={token} onTokenChange={setToken} />}

                {step === 'accounts' && (
                    <AccountSelectionStep
                        accountPreviews={accountPreviews}
                        selectedAccounts={selectedAccounts}
                        onToggle={handleToggleAccountSelection}
                    />
                )}
            </FormLayoutGroup>
        </FormPage>
    );
};
