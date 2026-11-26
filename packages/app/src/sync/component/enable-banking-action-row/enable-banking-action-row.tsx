import { ActivityIndicator, Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';

import type { UserIconNameEnum } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly subtitle: ReactNode;
    readonly isLoading: boolean;
    readonly onPress: () => void;
    readonly testID: string;
}

export const EnableBankingActionRow = ({ icon, title, subtitle, isLoading, onPress, testID }: Props) => {
    const pressableProps = { disabled: isLoading, accessibilityState: { disabled: isLoading, busy: isLoading } };
    const right = isLoading ? <ActivityIndicator size="small" /> : void 0;

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={<Text className="text-primary text-[17px] font-semibold">{title}</Text>}
            subtitle={subtitle}
            right={right}
            onPress={onPress}
            pressableProps={pressableProps}
            testID={testID}
        />
    );
};
