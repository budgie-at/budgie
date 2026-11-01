import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';

interface Props {
    readonly value: boolean;
    readonly onValueChange: (value: boolean) => void;
    readonly testID: string;
}

export const BudgetAutoTuneSwitchRow = ({ value, onValueChange, testID }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListSection>
            <GroupedListSwitchRow
                icon={UserIconNameEnum.WandSparkles}
                title={t`Tune limits automatically`}
                subtitle={t`Adjusts category limits after 3 periods of steady over or under spending`}
                value={value}
                switchTestID={testID}
                onChange={onValueChange}
            />
        </GroupedListSection>
    );
};
