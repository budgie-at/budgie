import { UserIconNameEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';
import { EnableBankingConnectionCardSelector } from '../enable-banking-connection-card/enable-banking-connection-card.selector';

interface Props {
    readonly applicationId: string;
}

export const EnableBankingChooseKeyRow = ({ applicationId }: Props) => {
    const { t } = useLingui();
    const explainError = useExplainEnableBankingError();
    const { run } = useSingleFlight();

    const handlePress = () =>
        run(
            Effect.gen(function* () {
                const connection = yield* EnableBankingConnectionService;
                const picked = yield* connection.pickKeyFile();

                if (!isDefined(picked)) {
                    return;
                }

                yield* connection.saveKey(applicationId, picked.pem);
                yield* Effect.flatMap(EnableBankingSyncService, service => service.requestSync());
                Toast.show({ type: 'success', text1: t`Key updated`, text2: t`Syncing resumes automatically.` });
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not update the key`))
        );

    return (
        <SettingsRow
            icon={UserIconNameEnum.KeyRound}
            variant="primary"
            title={t`Choose key file again`}
            subtitle={t`The key is missing or was rejected.`}
            onPress={handlePress}
            testID={EnableBankingConnectionCardSelector.ChooseKey}
        />
    );
};
