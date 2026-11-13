import { Text, View } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { BrokerageReturnText } from '../brokerage-return-text/brokerage-return-text';

interface Props {
    readonly gain: number;
    readonly percent: number | null;
    readonly instrumentSymbol: string;
    readonly caption: string;
    readonly testID: string;
}

export const BrokerageReturnHero = ({ gain, percent, instrumentSymbol, caption, testID }: Props) => (
    <View className="items-center gap-y-xxs px-5xl">
        <BrokerageReturnText
            gain={gain}
            percent={percent}
            instrumentSymbol={instrumentSymbol}
            className="text-center text-[17px] leading-[22px]"
            testID={testID}
        />
        <Text
            className="text-center text-[13px] leading-[18px] text-secondary-foreground"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
        >
            {caption}
        </Text>
    </View>
);
