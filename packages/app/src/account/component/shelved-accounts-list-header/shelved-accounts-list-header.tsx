import { Text, View } from 'react-native';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';

interface Props {
    readonly description: string;
    readonly title: string;
}

export const ShelvedAccountsListHeader = ({ description, title }: Props) => (
    <View className="gap-y-2xl">
        <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">{description}</Text>
        <GroupedListSectionTitle title={title} />
    </View>
);
