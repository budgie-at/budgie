import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { SyncHistoryDepthEnum } from '../../enum/sync-history-depth.enum';
import { useAccountSelection } from '../../hook/use-account-selection.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { AddBankIntegrationAccountsContent } from '../add-bank-integration-accounts-content/add-bank-integration-accounts-content';
import { SyncHistoryDepthStep } from '../sync-history-depth-step/sync-history-depth-step';

import { AddBankIntegrationAccountsSelector } from './add-bank-integration-accounts.selector';

import type { BankIntegrationEntityInterface } from '@budgie/contracts';

interface Props {
    readonly integration: BankIntegrationEntityInterface;
}

type AddAccountsStep = 'accounts' | 'history';

// eslint-disable-next-line max-lines-per-function, max-statements -- Multi-step setup orchestration with per-step content and footer
export const AddBankIntegrationAccounts = ({ integration }: Props) => {
    const { t } = useLingui();

    const [step, setStep] = useState<AddAccountsStep>('accounts');
    const [historyDepth, setHistoryDepth] = useState(SyncHistoryDepthEnum.MONTHS_3);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const { accountPreviews, selectedAccounts, setPreviews, toggleAccount, selectAllAccounts, deselectAllAccounts } = useAccountSelection();

    const setPreviewsRef = useRef(setPreviews);

    const handleRetry = () => void setReloadToken(previous => previous + 1);
    const handleConfirm = async (): Promise<void> => {
        setIsSubmitting(true);
        try {
            await monobankSyncService.setupAccountSyncBatch(integration.token, [...selectedAccounts], historyDepth);
            goBackOrReplace(`/bank-integration/${integration.id}`);
        } catch (error) {
            showErrorToast(t`Could not add accounts`, getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
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

        goBackOrReplace(`/bank-integration/${integration.id}`);
    };

    const canConfirm = !isLoading && !isDefined(fetchErrorMessage) && isNotEmptyArray(accountPreviews);
    const isConfirmDisabled = isSubmitting || selectedAccounts.size === 0;

    const accountsFooter = canConfirm ? (
        <View className="gap-md pt-xl px-7xl">
            <Button
                onPress={handleContinueToHistory}
                disabled={isConfirmDisabled}
                content={t`Continue`}
                testID={AddBankIntegrationAccountsSelector.ContinueButton}
            />
        </View>
    ) : null;
    const historyFooter = (
        <View className="gap-md pt-xl px-7xl">
            <Button
                onPress={handleConfirm}
                disabled={isConfirmDisabled}
                isLoading={isSubmitting}
                content={t`Add accounts`}
                testID={AddBankIntegrationAccountsSelector.ConfirmButton}
            />
        </View>
    );
    const footer = step === 'history' ? historyFooter : accountsFooter;

    useEffect(() => {
        setPreviewsRef.current = setPreviews;
    }, [setPreviews]);

    useEffect(() => {
        const loadAvailableAccounts = async (): Promise<void> => {
            setIsLoading(true);
            setFetchErrorMessage(null);
            try {
                const previews = await monobankSyncService.fetchAccountsPreview(integration.token);
                setPreviewsRef.current(previews.filter(preview => !isDefined(preview.existingAccountId)));
            } catch (error) {
                setFetchErrorMessage(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        };

        void loadAvailableAccounts();
    }, [integration.token, reloadToken]);

    const stepContent =
        step === 'history' ? (
            <SyncHistoryDepthStep selectedDepth={historyDepth} onSelect={setHistoryDepth} />
        ) : (
            <AddBankIntegrationAccountsContent
                isLoading={isLoading}
                fetchErrorMessage={fetchErrorMessage}
                accountPreviews={accountPreviews}
                selectedAccounts={selectedAccounts}
                onToggle={toggleAccount}
                onSelectAll={selectAllAccounts}
                onDeselectAll={deselectAllAccounts}
                onRetry={handleRetry}
            />
        );

    return (
        <CollapsibleChromePage
            title={t`Add accounts from bank`}
            leading={<GoBackButton onPress={handleStepAwareGoBack} />}
            testID={AddBankIntegrationAccountsSelector.ScrollView}
            footer={footer}
        >
            <FormLayoutGroup>{stepContent}</FormLayoutGroup>
        </CollapsibleChromePage>
    );
};
