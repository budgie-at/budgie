import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

export const RecurringFormClearRow = ({ label, testID, onPress }: Props) => (
    <GroupedListRow left={<GroupedListIcon icon={UserIconNameEnum.X} />} title={label} testID={testID} onPress={onPress} right={<View />} />
);
