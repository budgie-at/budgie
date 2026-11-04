import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';

export const EnableBankingReauthorizeRow = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const explainError = useExplainEnableBankingError();
    const { run } = useSingleFlight();

    const handlePress = () =>
        run(
            Effect.flatMap(EnableBankingConnectionService, connection => connection.reauthorize(integration.id)).pipe(
                Effect.mapError(explainError),
                toastOnFailure(t`Could not start the authorization`)
            )
        );

    return (
        <SettingsRow
            icon={UserIconNameEnum.RefreshCw}
            variant="primary"
            title={t`Authorize again`}
            subtitle={t`Renews the bank consent so syncing continues.`}
            onPress={handlePress}
        />
    );
};
