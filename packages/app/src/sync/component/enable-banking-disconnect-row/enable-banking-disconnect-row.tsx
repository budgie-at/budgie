import { UserIconNameEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { useProcessingHaptic } from '../../../@generic/hook/use-processing-haptic.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { EnableBankingConnectionCardSelector } from '../enable-banking-connection-card/enable-banking-connection-card.selector';

export const EnableBankingDisconnectRow = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const explainError = useExplainEnableBankingError();
    const [, hapticImpact] = useVibration();
    const { run: runConfirmation } = useSingleFlight();
    const { isLoading, run: runDisconnect } = useSingleFlight();

    useProcessingHaptic(isLoading);

    const handleDisconnect = () =>
        runDisconnect(
            Effect.gen(function* () {
                const isSessionRevoked = yield* Effect.flatMap(EnableBankingSyncService, service => service.disconnect(integration.id));

                Toast.show(
                    isSessionRevoked
                        ? { type: 'success', text1: t`Bank disconnected` }
                        : {
                              type: 'info',
                              text1: t`Disconnected on this phone`,
                              text2: t`The consent stays valid at your bank until it expires.`
                          }
                );
                router.dismissTo('/');
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not disconnect`))
        );

    const handlePress = () =>
        runConfirmation(
            confirmAlert({
                title: t`Disconnect this bank?`,
                message: t`Its accounts stop syncing and are removed from your active accounts.`,
                confirmText: t`Disconnect`,
                cancelText: t`Cancel`,
                isDestructive: true
            }).pipe(
                Effect.tap(isConfirmed =>
                    Effect.sync(() => {
                        if (isConfirmed) {
                            hapticImpact(ImpactFeedbackStyle.Heavy);
                            void handleDisconnect();
                        }
                    })
                )
            )
        );

    return (
        <GroupedListActionRow
            label={t`Disconnect`}
            icon={UserIconNameEnum.LogOut}
            labelClassName="text-destructive-strong"
            isDisabled={false}
            isLoading={isLoading}
            onPress={handlePress}
            testID={EnableBankingConnectionCardSelector.Disconnect}
        />
    );
};
