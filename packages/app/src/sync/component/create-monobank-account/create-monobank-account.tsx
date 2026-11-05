import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { MonobankConnectionResultEnum, MonobankSyncService, SyncHistoryDepthEnum } from '@budgie/sync';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useReducer } from 'react';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { Button } from '../../../@generic/component/button/button';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { OnboardingNote } from '../../../onboarding/component/onboarding-note/onboarding-note';
import { useIsOnboardingActive } from '../../../onboarding/hook/use-is-onboarding-active.hook';
import { DEFAULT_SYNC_HISTORY_DEPTH } from '../../constant/sync-history-depth-options.constant';
import { CreateMonobankAccountActionTypeEnum } from '../../enum/create-monobank-account-action-type.enum';
import { SetupStepEnum } from '../../enum/setup-step.enum';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { createMonobankAccountReducer } from '../../utils/create-monobank-account-reducer.util';
import { SyncAccountsStep } from '../sync-accounts-step/sync-accounts-step';
import { SyncHistoryDepthStep } from '../sync-history-depth-step/sync-history-depth-step';
import { SyncHistoryDurationNotice } from '../sync-history-duration-notice/sync-history-duration-notice';
import { SyncSetupPage } from '../sync-setup-page/sync-setup-page';
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

    const tokenStepDescription =
        step === SetupStepEnum.TOKEN
            ? t`Monobank gives you a personal token. Budgie uses it to talk to the bank directly, with no one in between.`
            : '';
    const selectedAccountCount = accountSelection.selectedAccounts.size;
    const addAccountsLabel = t({ message: plural(selectedAccountCount, { one: 'Add # account', other: 'Add # accounts' }) });
    const onboardingHistoryNote = isOnboardingActive ? (
        <OnboardingNote
            icon={UserIconNameEnum.CalendarDays}
            text={t`Budgie brings in the last month of history, then asks Monobank for new transactions when you open the app.`}
        />
    ) : null;
    const accountsFooter = isOnboardingActive ? (
        <Button
            variant="cta"
            onPress={handleSetupSync}
            disabled={isStartSyncDisabled}
            content={addAccountsLabel}
            testID={CreateMonobankAccountSelector.ContinueButton}
        />
    ) : (
        <PillButton
            label={t`Continue`}
            onPress={handleContinueToHistory}
            isDisabled={isStartSyncDisabled}
            testID={CreateMonobankAccountSelector.ContinueButton}
        />
    );

    let stepContent = <TokenInputStep token={token} onTokenChange={handleTokenChange} />;
    let footer = (
        <PillButton
            label={t`Connect`}
            onPress={handleFetchAccounts}
            isDisabled={isLoading}
            isLoading={isLoading}
            testID={CreateMonobankAccountSelector.FetchAccountsButton}
        />
    );

    const historyHintByDepth = {
        [SyncHistoryDepthEnum.MONTH_1]: t`About a minute`,
        [SyncHistoryDepthEnum.MONTHS_3]: t`About 3 minutes`,
        [SyncHistoryDepthEnum.MONTHS_6]: t`About 6 minutes`,
        [SyncHistoryDepthEnum.YEAR_1]: t`About 12 minutes`,
        [SyncHistoryDepthEnum.FULL]: t`Can take hours`,
        [SyncHistoryDepthEnum.NEW_ONLY]: t`Nothing from the past is imported`
    };

    switch (step) {
        case SetupStepEnum.ACCOUNTS:
            stepContent = (
                <>
                    <SyncAccountsStep
                        {...accountSelection}
                        logo={<BankLogo bankProvider={ExternalSourceEnum.MONOBANK} size={36} />}
                        footer={t`Choose what to track. Balances and history come straight from the bank.`}
                        emptyDescription={t`Monobank returned no accounts for this token.`}
                    />
                    {onboardingHistoryNote}
                </>
            );
            footer = accountsFooter;
            break;
        case SetupStepEnum.HISTORY:
            stepContent = (
                <>
                    <SyncHistoryDepthStep
                        selectedDepth={historyDepth}
                        description={t`Monobank sends about one month of history per minute, for each account you selected.`}
                        hintByDepth={historyHintByDepth}
                        onSelect={handleHistoryDepthSelect}
                    />
                    <SyncHistoryDurationNotice depth={historyDepth} />
                </>
            );
            footer = (
                <PillButton
                    label={t`Start sync`}
                    onPress={handleSetupSync}
                    isDisabled={isStartSyncDisabled}
                    testID={CreateMonobankAccountSelector.StartSyncButton}
                />
            );
            break;
        case SetupStepEnum.TOKEN:
        default:
            break;
    }

    return (
        <SyncSetupPage
            title={t`Connect Monobank`}
            description={tokenStepDescription}
            onGoBack={handleStepAwareGoBack}
            footerButton={footer}
            testID={CreateMonobankAccountSelector.ScrollView}
        >
            {stepContent}
        </SyncSetupPage>
    );
};
