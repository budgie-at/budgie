import { Text, useWindowDimensions, View } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props {
    readonly label: string;
    readonly value?: string;
    readonly testID?: string;
}

export const TransactionFieldCaption = ({ label, value, testID }: Props) => {
    const { fontScale } = useWindowDimensions();
    const nameStyle = { height: 16 * fontScale };
    const valueStyle = { height: 36 * fontScale };

    return (
        <View className="self-stretch">
            <Text
                className="text-center text-[12px] leading-[16px] text-secondary-foreground"
                style={nameStyle}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                {label}
            </Text>
            <Text
                className="text-center text-[13px] leading-[18px] text-primary"
                style={valueStyle}
                numberOfLines={2}
                ellipsizeMode="tail"
                {...testIDProps(testID, TestIDPartEnum.TITLE)}
            >
                {value}
            </Text>
        </View>
    );
};
