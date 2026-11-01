import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

interface Props {
    readonly testID?: string;
    readonly onPress: () => void;
}

export const BudgetAddCategoryLimitRow = ({ testID, onPress }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={UserIconNameEnum.ListPlus} iconClassName="text-default-foreground" />}
            title={t`Add a category limit`}
            titleClassName="text-default-foreground"
            testID={testID}
            onPress={onPress}
        />
    );
};
