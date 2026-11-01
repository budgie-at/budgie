import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

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
            title={
                <Text className="text-default-foreground text-[17px]" numberOfLines={2}>
                    {t`Add a category limit`}
                </Text>
            }
            testID={testID}
            onPress={onPress}
        />
    );
};
