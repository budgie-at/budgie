import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';

interface Props {
    readonly formattedBalance: string;
    readonly metadata: string;
    readonly notice: string | null;
}

export const ShelvedAccountSubtitle = ({ formattedBalance, metadata, notice }: Props) => (
    <View className="gap-y-xxs">
        <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={2}>
            <ProtectedText className="text-primary font-medium tabular-nums">{formattedBalance}</ProtectedText>
            {` · ${metadata}`}
        </Text>
        {isNotEmptyString(notice) ? (
            <Text className="text-secondary-foreground text-[13px] leading-[18px]" numberOfLines={2}>
                {notice}
            </Text>
        ) : null}
    </View>
);
