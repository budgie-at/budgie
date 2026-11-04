import { EnableBankingSyncService } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { appAtomRegistry } from '../../../@generic/constant/app-atom-registry.constant';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { enableBankingCallbackUrlAtom } from '../../constant/enable-banking-callback-url-atom.constant';
import { EnableBankingSetupStepEnum } from '../../enum/enable-banking-setup-step.enum';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { useSyncAccountSetupFlow } from '../../hook/use-sync-account-setup-flow.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';
import { parseEnableBankingApplicationId } from '../../utils/parse-enable-banking-application-id.util';
import { AccountSelectionStep } from '../account-selection-step/account-selection-step';
import { EnableBankingAccountsNotice } from '../enable-banking-accounts-notice/enable-banking-accounts-notice';
import { EnableBankingBankStep } from '../enable-banking-bank-step/enable-banking-bank-step';
import { EnableBankingKeyStep } from '../enable-banking-key-step/enable-banking-key-step';
import { EnableBankingWaitingStep } from '../enable-banking-waiting-step/enable-banking-waiting-step';
import { SyncAccountSetupPage } from '../sync-account-setup-page/sync-account-setup-page';

import type { EnableBankingAuthorizationResultInterface, EnableBankingBankInterface } from '@budgie/sync';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const CreateEnableBankingAccount = () => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();
    const callbackUrl = useAtomValue(enableBankingCallbackUrlAtom);

    const [step, setStep] = useState(() => (isDefined(callbackUrl) ? EnableBankingSetupStepEnum.WAITING : EnableBankingSetupStepEnum.KEY));
    const [applicationId, setApplicationId] = useState('');
    const [pickedPem, setPickedPem] = useState<string | null>(null);
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

                accountSelection.setPreviews(selectablePreviews);
                setAuthorization(result);
                setStep(EnableBankingSetupStepEnum.ACCOUNTS);
            }).pipe(
                Effect.mapError(explainError),
                toastOnFailure(t`Could not connect the bank`),
                Effect.tapError(() =>
                    Effect.sync(
                        () => void setStep(isNotEmptyArray(banks) ? EnableBankingSetupStepEnum.BANK : EnableBankingSetupStepEnum.KEY)
                    )
                )
            )
        )
    );

    useEffect(() => {
        if (isDefined(callbackUrl)) {
            appAtomRegistry.set(enableBankingCallbackUrlAtom, null);
            void handleCallback(callbackUrl);
        }
    }, [callbackUrl]);

    const handlePickKey = () =>
        run(
            Effect.gen(function* () {
                const picked = yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.pickKeyFile());

                if (isDefined(picked)) {
                    setPickedPem(picked.pem);
                    if (isDefined(picked.applicationId)) {
                        setApplicationId(picked.applicationId);
                    }
                }
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not read the key`))
        );

    const handleContinue = () => {
        if (!isDefined(parsedApplicationId) || !isDefined(pickedPem)) {
            showErrorToast(t`Key required`, t`Enter the application ID and choose the key file.`);

            return;
        }

        void run(
            Effect.gen(function* () {
                yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.saveKey(parsedApplicationId, pickedPem));
                setBanks(yield* Effect.flatMap(EnableBankingSyncService, service => service.listBanks(parsedApplicationId)));
                setStep(EnableBankingSetupStepEnum.BANK);
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not verify the application`))
        );
    };

    const handleSelectBank = (bank: EnableBankingBankInterface) => {
        if (!isDefined(parsedApplicationId)) {
            return;
        }

        void run(
            Effect.gen(function* () {
                yield* Effect.flatMap(EnableBankingConnectionService, connection => connection.begin(parsedApplicationId, bank, null));
                setStep(EnableBankingSetupStepEnum.WAITING);
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not start the authorization`))
        );
    };

    const handleChooseAnotherBank = () => {
        setStep(isNotEmptyArray(banks) ? EnableBankingSetupStepEnum.BANK : EnableBankingSetupStepEnum.KEY);
        void run(Effect.flatMap(EnableBankingConnectionService, connection => connection.discardPending()));
    };

    const handleChangeKey = () => {
        setStep(EnableBankingSetupStepEnum.KEY);
    };

    const handleStepAwareGoBack = () => {
        switch (step) {
            case EnableBankingSetupStepEnum.BANK:
                handleChangeKey();
                break;
            case EnableBankingSetupStepEnum.WAITING:
                handleChooseAnotherBank();
                break;
            case EnableBankingSetupStepEnum.KEY:
            case EnableBankingSetupStepEnum.ACCOUNTS:
            default:
                handleGoBack();
        }
    };

    let stepContent = (
        <EnableBankingKeyStep
            applicationId={applicationId}
            isKeyPicked={isDefined(pickedPem)}
            isLoading={isLoading}
            onApplicationIdChange={setApplicationId}
            onPickKey={handlePickKey}
        />
    );
    let footer = <Button onPress={handleContinue} disabled={isLoading} isLoading={isLoading} content={t`Continue`} />;

    switch (step) {
        case EnableBankingSetupStepEnum.BANK:
            stepContent = <EnableBankingBankStep banks={banks} onSelectBank={handleSelectBank} />;
            footer = <Button variant="ghost" onPress={handleChangeKey} content={t`Change key`} />;
            break;
        case EnableBankingSetupStepEnum.WAITING:
            stepContent = <EnableBankingWaitingStep />;
            footer = <Button variant="ghost" onPress={handleChooseAnotherBank} content={t`Choose another bank`} />;
            break;
        case EnableBankingSetupStepEnum.ACCOUNTS:
            stepContent = (
                <>
                    <AccountSelectionStep {...accountSelection} />
                    <EnableBankingAccountsNotice parkedPreviews={parkedPreviews} />
                </>
            );
            footer = <Button onPress={handleSetupSync} disabled={isStartSyncDisabled} isLoading={isSettingUp} content={t`Start Sync`} />;
            break;
        case EnableBankingSetupStepEnum.KEY:
        default:
            break;
    }

    return (
        <SyncAccountSetupPage
            title={t`Connect EU banks`}
            description={t`Sync Trade Republic, N26 and other EU banks through your own Enable Banking application.`}
            onGoBack={handleStepAwareGoBack}
            footer={footer}
        >
            {stepContent}
        </SyncAccountSetupPage>
    );
};
