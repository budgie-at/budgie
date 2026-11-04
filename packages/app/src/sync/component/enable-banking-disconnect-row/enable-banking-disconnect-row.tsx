import { UserIconNameEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';

export const EnableBankingDisconnectRow = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const explainError = useExplainEnableBankingError();
    const { run } = useSingleFlight();

    const handlePress = () =>
        run(
            Effect.gen(function* () {
                const isConfirmed = yield* confirmAlert({
                    title: t`Disconnect this bank?`,
                    message: t`Its accounts stop syncing and are removed from your active accounts.`,
                    confirmText: t`Disconnect`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!isConfirmed) {
                    return;
                }

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

    return <SettingsRow icon={UserIconNameEnum.LogOut} variant="destructive" title={t`Disconnect`} onPress={handlePress} />;
};
