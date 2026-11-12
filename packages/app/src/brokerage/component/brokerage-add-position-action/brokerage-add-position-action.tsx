import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { useBankIntegration } from '../../../sync/context/bank-integration.context';
import { BrokerageSelector } from '../../selector/brokerage.selector';

export const BrokerageAddPositionAction = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();

    const handlePress = () => void router.push({ pathname: '/securities/buy/[id]', params: { id: String(integration.id) } });

    return (
        <GroupedListActionRow
            label={t`Add position`}
            icon={UserIconNameEnum.Plus}
            onPress={handlePress}
            isDisabled={false}
            isLoading={false}
            labelClassName="text-primary"
            testID={BrokerageSelector.AddPositionButton}
        />
    );
};
