import { UserIconNameEnum } from '@budgie/contracts';
import { MonobankConnectionResultEnum, MonobankSyncService, SyncHistoryDepthEnum } from '@budgie/sync';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useReducer } from 'react';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { OnboardingNote } from '../../../onboarding/component/onboarding-note/onboarding-note';
import { useIsOnboardingActive } from '../../../onboarding/hook/use-is-onboarding-active.hook';
import { DEFAULT_SYNC_HISTORY_DEPTH } from '../../constant/sync-history-depth-options.constant';
import { CreateMonobankAccountActionTypeEnum } from '../../enum/create-monobank-account-action-type.enum';
import { SetupStepEnum } from '../../enum/setup-step.enum';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { createMonobankAccountReducer } from '../../utils/create-monobank-account-reducer.util';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';
import { SyncHistoryDepthStep } from '../sync-history-depth-step/sync-history-depth-step';
import { TokenInputStep } from '../token-input-step/token-input-step';

import { CreateMonobankAccountSelector } from './create-monobank-account.selector';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const CreateMonobankAccount = () => {
    const { t } = useLingui();

    const isOnboardingActive = useIsOnboardingActive();

    const [{ step, token, historyDepth }, dispatch] = useReducer(createMonobankAccountReducer, {
        step: SetupStepEnum.TOKEN,
        token: '',
        historyDepth: DEFAULT_SYNC_HISTORY_DEPTH
    });
    const effectiveHistoryDepth = isOnboardingActive ? SyncHistoryDepthEnum.MONTH_1 : historyDepth;

    const { accountSelection, isLoading, fetchAccountPreviews, handleGoBack, handleSetupSync, isStartSyncDisabled } =
        useSyncAccountSetupFlow(MonobankSyncService, (monobankSyncService, selectedAccountIds) =>
            monobankSyncService.setupAccountSyncBatch(token.trim(), selectedAccountIds, effectiveHistoryDepth)
        );

    const handleTokenRotated = (integrationId: number) => {
        Toast.show({ type: 'success', text1: t`Monobank key updated`, text2: t`Your accounts keep syncing with the new key.` });
        router.dismissTo({ pathname: '/bank-integration/[id]', params: { id: String(integrationId) } });
    };

    const handleFetchAccounts = () => {
        const trimmedToken = token.trim();

        if (!isNotEmptyString(trimmedToken)) {
            showErrorToast(t`Token required`, t`Please enter your Monobank API token`);

            return;
        }

        void fetchAccountPreviews(
            monobankSyncService =>
                monobankSyncService.fetchNewConnectionAccountsPreview(trimmedToken).pipe(
                    Effect.flatMap(result =>
                        result.kind === MonobankConnectionResultEnum.TOKEN_ROTATED
                            ? Effect.as(
                                  Effect.sync(() => void handleTokenRotated(result.integrationId)),
                                  null
                              )
                            : Effect.succeed(result.previews)
                    ),
                    Effect.catchTags({
                        SyncTokenAlreadyConnectedError: () =>
                            Effect.sync(() => {
                                showErrorToast(
                                    t`Token already connected`,
                                    t`This token already syncs one of your Monobank sections. Use the gear on its Home section to add accounts.`
                                );

                                return null;
                            })
                    })
                ),
            previews => {
                accountSelection.setPreviews(previews);
                dispatch({ type: CreateMonobankAccountActionTypeEnum.ACCOUNTS_FETCHED });
            }
        );
    };

    const handleStepAwareGoBack = () => {
        if (step === SetupStepEnum.TOKEN) {
            handleGoBack();

            return;
        }

        dispatch({ type: CreateMonobankAccountActionTypeEnum.STEP_BACK });
    };

    const handleContinueToHistory = () => {
        dispatch({ type: CreateMonobankAccountActionTypeEnum.CONTINUED_TO_HISTORY });
    };

    const handleTokenChange = (value: string) => {
        dispatch({ type: CreateMonobankAccountActionTypeEnum.TOKEN_CHANGED, token: value });
    };

    const handleHistoryDepthSelect = (value: SyncHistoryDepthEnum) => {
        dispatch({ type: CreateMonobankAccountActionTypeEnum.HISTORY_DEPTH_SELECTED, historyDepth: value });
    };

    const selectedAccountCount = accountSelection.selectedAccounts.size;
    const addAccountsLabel = t({ message: plural(selectedAccountCount, { one: 'Add # account', other: 'Add # accounts' }) });
    const onboardingHistoryNote = isOnboardingActive ? (
        <OnboardingNote
            icon={UserIconNameEnum.CalendarDays}
            text={t`Budgie brings in the last month of history, then asks Monobank for new transactions when you open the app.`}
        />
    ) : null;
    const accountsFooterVariant = isOnboardingActive ? 'cta' : 'primary';
    const accountsFooterLabel = isOnboardingActive ? addAccountsLabel : t`Continue`;
    const handleAccountsFooterPress = isOnboardingActive ? handleSetupSync : handleContinueToHistory;
    const accountsFooter = (
        <Button
            variant={accountsFooterVariant}
            onPress={handleAccountsFooterPress}
            disabled={isStartSyncDisabled}
            content={accountsFooterLabel}
            testID={CreateMonobankAccountSelector.ContinueButton}
        />
    );

    let stepContent = <TokenInputStep token={token} onTokenChange={handleTokenChange} />;
    let footer = <Button onPress={handleFetchAccounts} disabled={isLoading} isLoading={isLoading} content={t`Connect`} />;

    switch (step) {
        case SetupStepEnum.ACCOUNTS:
            stepContent = (
                <>
                    <AccountSelectionStep {...accountSelection} />
                    {onboardingHistoryNote}
                </>
            );
            footer = accountsFooter;
            break;
        case SetupStepEnum.HISTORY:
            stepContent = <SyncHistoryDepthStep selectedDepth={historyDepth} onSelect={handleHistoryDepthSelect} />;
            footer = <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} content={t`Start Sync`} />;
            break;
        case SetupStepEnum.TOKEN:
        default:
            break;
    }

    return (
        <SyncAccountSetupPage
            title={t`Connect Monobank`}
            description={t`Monobank gives you a personal token. Budgie uses it to talk to the bank directly, with no one in between.`}
            onGoBack={handleStepAwareGoBack}
            footer={footer}
            scrollViewTestID={CreateMonobankAccountSelector.ScrollView}
        >
            {stepContent}
        </SyncAccountSetupPage>
    );
};
