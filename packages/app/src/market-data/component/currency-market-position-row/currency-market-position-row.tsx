import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly valueClassName: string;
    readonly testID: string;
    readonly subtitle?: string | null;
}

export const CurrencyMarketPositionRow = ({ label, value, valueClassName, testID, subtitle }: Props) => (
    <GroupedListRow
        testID={testID}
        title={
            <View className="gap-y-xxs">
                <View className="flex-row flex-wrap items-center justify-between gap-x-xl">
                    <Text className="text-primary text-[17px]">{label}</Text>
                    <ProtectedText className={cn('ml-auto text-right text-[17px] tabular-nums', valueClassName)}>
                        {value}
                    </ProtectedText>
                </View>
                {isNotEmptyString(subtitle) ? (
                    <Text className="text-secondary-foreground text-[13px] leading-[18px]">{subtitle}</Text>
                ) : null}
            </View>
        }
    />
);
