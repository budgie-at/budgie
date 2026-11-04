import {
    EnableBankingCallbackError,
    EnableBankingCallbackFailureEnum,
    EnableBankingSyncService,
    SyncUnauthorizedError
} from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { appAtomRegistry } from '../../../@generic/constant/app-atom-registry.constant';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { enableBankingCallbackUrlAtom } from '../../constant/enable-banking-callback-url-atom.constant';
import { EnableBankingSetupErrorReasonEnum } from '../../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupStepEnum } from '../../enum/enable-banking-setup-step.enum';
import { EnableBankingSetupError } from '../../error/enable-banking-setup.error';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';
import { parseEnableBankingApplicationId } from '../../utils/parse-enable-banking-application-id.util';
import { EnableBankingAccountsStep } from '../enable-banking-accounts-step/enable-banking-accounts-step';
import { EnableBankingBankStep } from '../enable-banking-bank-step/enable-banking-bank-step';
import { EnableBankingKeyStep } from '../enable-banking-key-step/enable-banking-key-step';
import { EnableBankingSetupGuide } from '../enable-banking-setup-guide/enable-banking-setup-guide';
import { EnableBankingSetupPage } from '../enable-banking-setup-page/enable-banking-setup-page';
import { EnableBankingWaitingStep } from '../enable-banking-waiting-step/enable-banking-waiting-step';

import { CreateEnableBankingAccountSelector } from './create-enable-banking-account.selector';

import type { EnableBankingAuthorizationResultInterface, EnableBankingBankInterface } from '@budgie/sync';
import type { ReactNode } from 'react';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const CreateEnableBankingAccount = () => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();
    const callbackUrl = useAtomValue(enableBankingCallbackUrlAtom);

    const [step, setStep] = useState(() =>
        isDefined(callbackUrl) ? EnableBankingSetupStepEnum.WAITING : EnableBankingSetupStepEnum.GUIDE
    );
    const [applicationId, setApplicationId] = useState('');
    const [pickedPem, setPickedPem] = useState<string | null>(null);
    const [isKeySaved, setIsKeySaved] = useState(false);
    const [savedApplicationId, setSavedApplicationId] = useState<string | null>(null);
    const [banks, setBanks] = useState<readonly EnableBankingBankInterface[]>([]);
    const [authorization, setAuthorization] = useState<EnableBankingAuthorizationResultInterface | null>(null);
    const { isLoading: isBusy, run } = useSingleFlight();

    const {
        accountSelection,
        isLoading: isSettingUp,
        handleGoBack,
        handleSetupSync,
        isStartSyncDisabled
    } = useSyncAccountSetupFlow(EnableBankingSyncService, (enableBankingSyncService, selectedAccountIds) =>
        isDefined(authorization)
            ? enableBankingSyncService.setupAccountSyncBatch(authorization.token, authorization.accounts, selectedAccountIds)
            : Effect.void
    );

    const parsedApplicationId = parseEnableBankingApplicationId(applicationId);
    const isLoading = isBusy || isSettingUp;
    const parkedPreviews = authorization?.previews.filter(preview => preview.isParked) ?? [];

    const handleCallback = useEffectEvent((url: string) =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.finish(url));

                const selectablePreviews = result.previews.filter(preview => !preview.isParked);

                if (isDefined(result.integrationId) && selectablePreviews.every(preview => preview.hasSync)) {
                    Toast.show({ type: 'success', text1: t`Bank authorized again`, text2: t`Syncing resumes automatically.` });
                    router.dismissTo({ pathname: '/bank-integration/[id]', params: { id: String(result.integrationId) } });

                    return;
                }

                accountSelection.setPreviews(selectablePreviews, selectablePreviews);
                setAuthorization(result);
                setStep(EnableBankingSetupStepEnum.ACCOUNTS);
            }).pipe(
                Effect.tapError(error =>
                    Effect.sync(() => {
                        const isForeignCallback =
                            error instanceof EnableBankingCallbackError &&
                            (error.failure === EnableBankingCallbackFailureEnum.STATE_MISMATCH ||
                                error.failure === EnableBankingCallbackFailureEnum.MALFORMED);

                        if (!isForeignCallback) {
                            setStep(isNotEmptyArray(banks) ? EnableBankingSetupStepEnum.BANK : EnableBankingSetupStepEnum.KEY);
                        }
                    })
                ),
                Effect.mapError(explainError),
                toastOnFailure(t`Could not connect the bank`)
            )
        )
    );

    useEffect(() => {
        if (isDefined(callbackUrl)) {
            appAtomRegistry.set(enableBankingCallbackUrlAtom, null);
            void handleCallback(callbackUrl);
        }
    }, [callbackUrl]);

    const discardSavedKey = (applicationIdToDiscard: string | null) => {
        if (isDefined(applicationIdToDiscard)) {
            appRuntime.runFork(
                Effect.flatMap(EnableBankingConnectionService, connection => connection.discardUnusedKey(applicationIdToDiscard)).pipe(
                    Effect.ignore
                )
            );
        }
    };

    const handleUnmount = useEffectEvent(() => {
        discardSavedKey(savedApplicationId);
    });

    useEffect(() => () => void handleUnmount(), []);

    const handleApplicationIdChange = (value: string) => {
        if (value !== savedApplicationId) {
            discardSavedKey(savedApplicationId);
            setSavedApplicationId(null);
        }
        setApplicationId(value);
        setIsKeySaved(false);
    };

    const handlePickKey = () =>
        run(
            Effect.gen(function* () {
                const picked = yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.pickKeyFile());

                if (isDefined(picked)) {
                    setPickedPem(picked.pem);
                    setIsKeySaved(false);
                    if (isDefined(picked.applicationId)) {
                        setApplicationId(picked.applicationId);
                    }
                }
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not read the key`))
        );

    const handleContinue = () => {
        if (!isDefined(parsedApplicationId)) {
            return;
        }

        void run(
            Effect.gen(function* () {
                if (isDefined(pickedPem)) {
                    yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.saveKey(parsedApplicationId, pickedPem));
                    setPickedPem(null);
                    setIsKeySaved(true);
                    setSavedApplicationId(parsedApplicationId);
                }
                setBanks(
                    yield* Effect.flatMap(EnableBankingSyncService, service => service.listBanks(parsedApplicationId)).pipe(
                        Effect.mapError(error =>
                            error instanceof SyncUnauthorizedError
                                ? new EnableBankingSetupError({ reason: EnableBankingSetupErrorReasonEnum.INACTIVE_APPLICATION })
                                : error
                        )
                    )
                );
                setStep(EnableBankingSetupStepEnum.BANK);
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not verify the application`))
        );
    };

    const handleSelectBank = (bank: EnableBankingBankInterface) => {
        if (!isDefined(parsedApplicationId)) {
            return;
        }

        setStep(EnableBankingSetupStepEnum.WAITING);
        void run(
            Effect.flatMap(EnableBankingConnectionService, connection => connection.begin(parsedApplicationId, bank, null)).pipe(
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
        void run(Effect.flatMap(EnableBankingConnectionService, connection => connection.discardPending()));
    };

    const handleStepAwareGoBack = () => {
        switch (step) {
            case EnableBankingSetupStepEnum.BANK:
                setStep(EnableBankingSetupStepEnum.KEY);
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

    const isKeyPicked = isDefined(pickedPem) || isKeySaved;
    const isContinueDisabled = !isDefined(parsedApplicationId) || !isKeyPicked;

    const handleHaveKey = () => {
        setStep(EnableBankingSetupStepEnum.KEY);
    };

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
            stepContent = <EnableBankingWaitingStep onChooseAnotherBank={handleChooseAnotherBank} />;
            footerButton = null;
            break;
        case EnableBankingSetupStepEnum.ACCOUNTS:
            title = t`Choose accounts`;
            stepContent = <EnableBankingAccountsStep {...accountSelection} parkedPreviews={parkedPreviews} />;
            footerButton = isEmptyArray(accountSelection.accountPreviews) ? null : (
                <PillButton
                    label={t`Start sync`}
                    onPress={handleSetupSync}
                    isDisabled={isStartSyncDisabled}
                    isLoading={isSettingUp}
                    testID={CreateEnableBankingAccountSelector.ContinueButton}
                />
            );
            break;
        case EnableBankingSetupStepEnum.BANK:
        case EnableBankingSetupStepEnum.GUIDE:
        default:
            break;
    }

    if (step === EnableBankingSetupStepEnum.BANK) {
        return <EnableBankingBankStep banks={banks} onSelectBank={handleSelectBank} onGoBack={handleStepAwareGoBack} />;
    }

    return (
        <EnableBankingSetupPage key={step} title={title} onGoBack={handleStepAwareGoBack} footerButton={footerButton}>
            {stepContent}
        </EnableBankingSetupPage>
    );
};
