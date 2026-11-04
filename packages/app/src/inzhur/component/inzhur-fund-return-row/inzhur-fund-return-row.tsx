import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';

interface Props {
    readonly label: string;
    readonly caption?: string;
    readonly value: string;
}

export const InzhurFundReturnRow = ({ label, caption, value }: Props) => (
    <View accessible className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-md">
        <View className="flex-1 gap-y-xxs">
            <Text className="text-[15px] text-primary" numberOfLines={1}>
                {label}
            </Text>
            {isDefined(caption) ? <Text className="text-[13px] text-secondary-foreground">{caption}</Text> : null}
        </View>
        <ProtectedText className="text-[15px] font-semibold text-primary tabular-nums">{value}</ProtectedText>
    </View>
);
