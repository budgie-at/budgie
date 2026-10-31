import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly testID: string;
    readonly subtitle?: string;
}

export const BudgetCategoryLimitLabel = ({ icon, title, testID, subtitle }: Props) => (
    <View className="min-h-[44px] flex-row items-center gap-x-xl">
        <GroupedListIcon icon={icon} />
        <View className="flex-1">
            <Text className="text-primary text-[17px]" numberOfLines={1} testID={testID}>
                {title}
            </Text>
            {isNotEmptyString(subtitle) ? <Text className="text-secondary-foreground text-[13px]">{subtitle}</Text> : null}
        </View>
    </View>
);
