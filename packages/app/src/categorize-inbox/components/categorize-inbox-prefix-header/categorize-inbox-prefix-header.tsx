import { Text, View } from 'react-native';

import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';

interface Props {
    readonly prefix: string;
    readonly rowCount: number;
}

export const CategorizeInboxPrefixHeader = ({ prefix, rowCount }: Props) => (
    <View className="px-3xl pb-sm">
        <Text className="text-[13px] leading-[17px] text-secondary-foreground">
            {`${formatCategorizeInboxMerchantTitle(prefix)} `}
            <Text className="tabular-nums">{rowCount}</Text>
        </Text>
    </View>
);
