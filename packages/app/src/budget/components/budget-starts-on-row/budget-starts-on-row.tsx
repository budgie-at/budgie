import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { BudgetSelector } from '../../budget.selector';

interface Props {
    readonly value: string;
    readonly onPress?: () => void;
}

export const BudgetStartsOnRow = ({ value, onPress }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListValueRow
            icon={UserIconNameEnum.CalendarClock}
            title={t`Starts on`}
            value={value}
            {...(isDefined(onPress) && { testID: BudgetSelector.SetupStartsOnRow, onPress })}
        />
    );
};
