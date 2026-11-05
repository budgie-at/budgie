import { EnableBankingSyncService, SyncHistoryDepthEnum, SyncUnauthorizedError } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { appAtomRegistry } from '../../../@generic/constant/app-atom-registry.constant';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { enableBankingCallbackUrlAtom } from '../../constant/enable-banking-callback-url-atom.constant';
import { EnableBankingSetupErrorReasonEnum } from '../../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupStepEnum } from '../../enum/enable-banking-setup-step.enum';
import { EnableBankingSetupError } from '../../error/enable-banking-setup.error';
import { useEnableBankingCallback } from '../../hook/use-enable-banking-callback.hook';
import { useEnableBankingKeyState } from '../../hook/use-enable-banking-key-state.hook';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';
import { EnableBankingBankStep } from '../enable-banking-bank-step/enable-banking-bank-step';
import { EnableBankingConnectAccountStep } from '../enable-banking-connect-account-step/enable-banking-connect-account-step';
import { EnableBankingKeyStep } from '../enable-banking-key-step/enable-banking-key-step';
import { EnableBankingSetupGuide } from '../enable-banking-setup-guide/enable-banking-setup-guide';
import { EnableBankingWaitingStep } from '../enable-banking-waiting-step/enable-banking-waiting-step';
import { SyncAccountsStep } from '../sync-accounts-step/sync-accounts-step';
import { SyncHistoryStep } from '../sync-history-step/sync-history-step';
import { SyncParkedAccountsSection } from '../sync-parked-accounts-section/sync-parked-accounts-section';
import { SyncSetupPage } from '../sync-setup-page/sync-setup-page';

import { CreateEnableBankingAccountSelector } from './create-enable-banking-account.selector';

import type { EnableBankingAuthorizationInterface } from '../../interface/enable-banking-authorization.interface';
import type { EnableBankingBankInterface } from '@budgie/sync';
import type { ReactNode } from 'react';

interface Props {
    readonly connectAccountId: number | null;
    readonly savedApplicationId: string | null;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const CreateEnableBankingAccount = ({ connectAccountId, savedApplicationId: connectApplicationId }: Props) => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();
    const hasConnectKey = isDefined(connectApplicationId);
    const [step, setStep] = useState(() => {
        if (isDefined(appAtomRegistry.get(enableBankingCallbackUrlAtom))) {
            return EnableBankingSetupStepEnum.WAITING;
        }

        return hasConnectKey ? EnableBankingSetupStepEnum.BANK : EnableBankingSetupStepEnum.GUIDE;
    });
    const [banks, setBanks] = useState<readonly EnableBankingBankInterface[]>([]);
    const [authorization, setAuthorization] = useState<EnableBankingAuthorizationInterface | null>(null);
    const [historyDepth, setHistoryDepth] = useState(SyncHistoryDepthEnum.FULL);
    const { isLoading: isBusy, run } = useSingleFlight();
    const { applicationId, parsedApplicationId, isKeyPicked, handleApplicationIdChange, handlePickKey, savePickedKey } =
        useEnableBankingKeyState(run, connectApplicationId);

    const {
        accountSelection,
        isLoading: isSettingUp,
        handleGoBack,
        handleSetupSync,
        isStartSyncDisabled
    } = useSyncAccountSetupFlow(EnableBankingSyncService, (enableBankingSyncService, selectedAccountIds) =>
        isDefined(authorization)
            ? enableBankingSyncService.setupAccountSyncBatch(authorization.token, authorization.accounts, selectedAccountIds, historyDepth)
            : Effect.void
    );

    const isLoading = isBusy || isSettingUp;

    useEnableBankingCallback(
        run,
        result => {
            const selectablePreviews = result.previews.filter(preview => !preview.isParked);

            if (isDefined(result.connectChoices)) {
                setAuthorization(result);
                setStep(EnableBankingSetupStepEnum.ACCOUNTS);
            } else if (isDefined(result.integrationId) && selectablePreviews.every(preview => preview.hasSync)) {
                Toast.show({ type: 'success', text1: t`Bank authorized again`, text2: t`Syncing resumes automatically.` });
                router.dismissTo({ pathname: '/bank-integration/[id]', params: { id: String(result.integrationId) } });
            } else {
                accountSelection.setPreviews(selectablePreviews, selectablePreviews);
                setAuthorization(result);
                setStep(EnableBankingSetupStepEnum.ACCOUNTS);
            }
        },
        () => {
            setStep(isNotEmptyArray(banks) ? EnableBankingSetupStepEnum.BANK : EnableBankingSetupStepEnum.KEY);
        }
    );

    const handleContinue = () => {
        if (!isDefined(parsedApplicationId)) {
            return;
        }

        void run(
            Effect.gen(function* () {
                yield* savePickedKey(parsedApplicationId);
                const banks = yield* Effect.flatMap(EnableBankingSyncService, service => service.listBanks(parsedApplicationId)).pipe(
                    Effect.mapError(error =>
                        Schema.is(SyncUnauthorizedError)(error)
                            ? EnableBankingSetupError.make({ reason: EnableBankingSetupErrorReasonEnum.INACTIVE_APPLICATION })
                            : error
                    )
                );
                setBanks(banks);
                setStep(EnableBankingSetupStepEnum.BANK);
            }).pipe(
                Effect.tapError(() =>
                    Effect.sync(() => {
                        setStep(EnableBankingSetupStepEnum.KEY);
                    })
                ),
                Effect.mapError(explainError),
                toastOnFailure(t`Could not verify the application`)
            )
        );
    };

    const loadSavedKeyBanks = useEffectEvent(handleContinue);

    useEffect(() => {
        if (hasConnectKey) {
            loadSavedKeyBanks();
        }
    }, [hasConnectKey]);

    const handleSelectBank = (bank: EnableBankingBankInterface) => {
        if (!isDefined(parsedApplicationId)) {
            return;
        }

        void run(
            Effect.gen(function* () {
                setStep(EnableBankingSetupStepEnum.WAITING);
                yield* Effect.flatMap(EnableBankingConnectionService, connection =>
                    connection.begin(parsedApplicationId, bank, null, connectAccountId)
                );
            }).pipe(
                Effect.tapError(() =>
                    Effect.sync(() => {
                        setStep(EnableBankingSetupStepEnum.BANK);
                    })
                ),
                Effect.mapError(explainError),
                toastOnFailure(t`Could not start the authorization`)
            )
        );
    };

    const handleChooseAnotherBank = () => {
        if (isBusy) {
            return;
        }

        setStep(isNotEmptyArray(banks) ? EnableBankingSetupStepEnum.BANK : EnableBankingSetupStepEnum.KEY);
        void run(Effect.flatMap(EnableBankingConnectionService, connection => connection.discardPending));
    };

    const handleStepAwareGoBack = () => {
        switch (step) {
            case EnableBankingSetupStepEnum.BANK:
                if (hasConnectKey) {
                    handleGoBack();
                } else {
                    setStep(EnableBankingSetupStepEnum.KEY);
                }
                break;
            case EnableBankingSetupStepEnum.HISTORY:
                setStep(EnableBankingSetupStepEnum.ACCOUNTS);
                break;
            case EnableBankingSetupStepEnum.WAITING:
                handleChooseAnotherBank();
                break;
            case EnableBankingSetupStepEnum.KEY:
                setStep(EnableBankingSetupStepEnum.GUIDE);
                break;
            case EnableBankingSetupStepEnum.GUIDE:
            case EnableBankingSetupStepEnum.ACCOUNTS:
            default:
                handleGoBack();
        }
    };

    const isContinueDisabled = !isDefined(parsedApplicationId) || !isKeyPicked;

    const handleShowHistory = () => {
        setStep(EnableBankingSetupStepEnum.HISTORY);
    };

    const handleHaveKey = () => {
        setStep(EnableBankingSetupStepEnum.KEY);
    };

    const missingAccount = t`Missing an account? Link it to your application in Enable Banking, then connect this bank again.`;
    const parkedPreviews = authorization?.previews.filter(preview => preview.isParked) ?? [];
    let title = t`Connect EU banks`;
    let stepContent = <EnableBankingSetupGuide />;
    let footerButton: ReactNode = (
        <PillButton label={t`I have my key file`} onPress={handleHaveKey} testID={CreateEnableBankingAccountSelector.ContinueButton} />
    );

    switch (step) {
        case EnableBankingSetupStepEnum.KEY:
            title = t`Add your key`;
            stepContent = (
                <EnableBankingKeyStep
                    applicationId={applicationId}
                    isKeyPicked={isKeyPicked}
                    onApplicationIdChange={handleApplicationIdChange}
                    onPickKey={handlePickKey}
                />
            );
            footerButton = (
                <PillButton
                    label={t`Continue`}
                    onPress={handleContinue}
                    isDisabled={isContinueDisabled}
                    isLoading={isLoading}
                    testID={CreateEnableBankingAccountSelector.ContinueButton}
                />
            );
            break;
        case EnableBankingSetupStepEnum.WAITING:
            title = t`Authorize at your bank`;
            stepContent = <EnableBankingWaitingStep isBusy={isBusy} onChooseAnotherBank={handleChooseAnotherBank} />;
            footerButton = null;
            break;
        case EnableBankingSetupStepEnum.ACCOUNTS:
            title = t`Choose accounts`;
            stepContent = (
                <>
                    <SyncAccountsStep
                        {...accountSelection}
                        logo={<BankLogo bankName={authorization?.bankName} size={36} />}
                        footer={`${t`Balances and history come from your bank through Enable Banking.`} ${missingAccount}`}
                        emptyDescription={missingAccount}
                    />
                    <SyncParkedAccountsSection
                        previews={parkedPreviews}
                        footer={t`These accounts already exist in Budgie or use a currency Budgie does not support. To continue an existing account, open it and tap Connect to bank.`}
                    />
                </>
            );
            footerButton = isEmptyArray(accountSelection.accountPreviews) ? null : (
                <PillButton
                    label={t`Continue`}
                    onPress={handleShowHistory}
                    isDisabled={isStartSyncDisabled}
                    testID={CreateEnableBankingAccountSelector.ContinueButton}
                />
            );
            break;
        case EnableBankingSetupStepEnum.HISTORY:
            title = t`History depth`;
            stepContent = <SyncHistoryStep selectedDepth={historyDepth} onSelect={setHistoryDepth} />;
            footerButton = (
                <PillButton
                    label={t`Start sync`}
                    onPress={handleSetupSync}
                    isDisabled={isStartSyncDisabled}
                    isLoading={isSettingUp}
                    testID={CreateEnableBankingAccountSelector.StartSyncButton}
                />
            );
            break;
        case EnableBankingSetupStepEnum.BANK:
        case EnableBankingSetupStepEnum.GUIDE:
        default:
            break;
    }

    if (step === EnableBankingSetupStepEnum.ACCOUNTS && isDefined(authorization?.connectChoices)) {
        return <EnableBankingConnectAccountStep authorization={authorization} choices={authorization.connectChoices} />;
    }

    if (step === EnableBankingSetupStepEnum.BANK) {
        return <EnableBankingBankStep banks={banks} isLoading={isBusy} onSelectBank={handleSelectBank} onGoBack={handleStepAwareGoBack} />;
    }

    return (
        <SyncSetupPage key={step} title={title} onGoBack={handleStepAwareGoBack} footerButton={footerButton}>
            {stepContent}
        </SyncSetupPage>
    );
};
