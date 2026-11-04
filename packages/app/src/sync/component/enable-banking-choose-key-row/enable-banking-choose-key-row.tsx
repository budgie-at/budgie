import { UserIconNameEnum } from '@budgie/contracts';
import { EnableBankingSyncService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useExplainEnableBankingError } from '../../hook/use-explain-enable-banking-error.hook';
import { EnableBankingConnectionService } from '../../service/enable-banking-connection.service';

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
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.KeyRound} />}
            title={<Text className="text-primary text-[17px] font-semibold">{t`Choose key file again`}</Text>}
            subtitle={t`The key is missing or was rejected.`}
            onPress={handlePress}
        />
    );
};
