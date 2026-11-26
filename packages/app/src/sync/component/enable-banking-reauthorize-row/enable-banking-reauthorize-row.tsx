import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';
import { EnableBankingActionRow } from '../enable-banking-action-row/enable-banking-action-row';
import { EnableBankingConnectionCardSelector } from '../enable-banking-connection-card/enable-banking-connection-card.selector';

interface Props {
    readonly subtitle: string;
}

export const EnableBankingReauthorizeRow = ({ subtitle }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const explainError = useExplainEnableBankingError();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () =>
        run(
            Effect.flatMap(EnableBankingConnectionService, connection => connection.reauthorize(integration.id)).pipe(
                Effect.mapError(explainError),
                toastOnFailure(t`Could not start the authorization`)
            )
        );

    return (
        <EnableBankingActionRow
            icon={UserIconNameEnum.RefreshCw}
            title={t`Authorize again`}
            subtitle={<Text className="text-secondary-foreground text-[13px] leading-[18px]">{subtitle}</Text>}
            isLoading={isLoading}
            onPress={handlePress}
            testID={EnableBankingConnectionCardSelector.Reauthorize}
        />
    );
};
