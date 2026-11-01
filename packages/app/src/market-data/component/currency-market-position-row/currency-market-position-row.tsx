import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly valueClassName: string;
    readonly testID: string;
    readonly subtitle?: string | null;
    readonly subtitleTestID?: string;
}

const PROTECTED_CLASSNAME = 'text-secondary-foreground';

export const CurrencyMarketPositionRow = ({ label, value, valueClassName, testID, subtitle, subtitleTestID }: Props) => {
    const isAmountProtected = useIsAmountProtected();

    const amountClassName = isAmountProtected ? PROTECTED_CLASSNAME : valueClassName;

    return (
        <GroupedListRow
            testID={testID}
            title={
                <View className="min-h-[32px] justify-center gap-y-xxs">
                    <View className="flex-row flex-wrap items-center justify-between gap-x-xl">
                        <Text className="text-primary text-[17px]">{label}</Text>
                        <ProtectedText
                            className={cn('ml-auto text-right text-[17px] tabular-nums', amountClassName)}
                            placeholderText={PROTECTED_HERO_PLACEHOLDER}
                        >
                            {value}
                        </ProtectedText>
                    </View>
                    {isNotEmptyString(subtitle) ? (
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]" testID={subtitleTestID}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            }
        />
    );
};
