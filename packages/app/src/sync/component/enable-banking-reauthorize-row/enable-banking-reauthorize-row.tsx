import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';

interface Props {
    readonly subtitle: string;
}

export const EnableBankingReauthorizeRow = ({ subtitle }: Props) => {
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
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.RefreshCw} />}
            title={<Text className="text-primary text-[17px] font-semibold">{t`Authorize again`}</Text>}
            subtitle={<Text className="text-secondary-foreground text-[13px] leading-[18px]">{subtitle}</Text>}
            onPress={handlePress}
        />
    );
};
