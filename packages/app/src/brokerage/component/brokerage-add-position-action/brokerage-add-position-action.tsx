import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useBankIntegration } from '../../../sync/context/bank-integration.context';
import { BrokerageSelector } from '../../selector/brokerage.selector';

export const BrokerageAddPositionAction = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const openSecuritySelector = useOpenModal('/security-selector');

    const handlePress = () => {
        openSecuritySelector({ selectedSymbol: null }, listing => {
            if (isDefined(listing)) {
                router.push({ pathname: '/securities/buy/[id]', params: { id: String(integration.id), ...listing } });
            }
        });
    };

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
