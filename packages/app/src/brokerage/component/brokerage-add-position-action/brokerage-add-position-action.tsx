import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { useOpenAddPosition } from '../../hook/use-open-add-position.hook';
import { BrokerageSelector } from '../../selector/brokerage.selector';

export const BrokerageAddPositionAction = () => {
    const { t } = useLingui();
    const handlePress = useOpenAddPosition();

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
