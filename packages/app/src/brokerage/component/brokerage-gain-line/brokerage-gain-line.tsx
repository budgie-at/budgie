import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { BrokerageSelector } from '../../selector/brokerage.selector';
import { BrokerageReturnHero } from '../brokerage-return-hero/brokerage-return-hero';

interface Props {
    readonly gain: number;
    readonly percent: number | null;
    readonly instrumentSymbol: string;
    readonly isLoading: boolean;
    readonly isPartial: boolean;
}

export const BrokerageGainLine = ({ gain, percent, instrumentSymbol, isLoading, isPartial }: Props) => {
    const { t } = useLingui();

    return (
        <LoadingContent isLoading={isLoading} loadingIndicator={null}>
            {isPartial ? (
                <View className="items-center gap-y-xxs px-5xl" accessible accessibilityLabel={t`Partial value — some prices unavailable`}>
                    <Text
                        className="text-center text-[15px] leading-[20px] font-semibold text-warning-foreground"
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        <Trans>Partial value</Trans>
                    </Text>
                    <Text
                        className="text-center text-[13px] leading-[18px] text-secondary-foreground"
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        <Trans>Some prices are unavailable</Trans>
                    </Text>
                </View>
            ) : (
                <BrokerageReturnHero
                    gain={gain}
                    percent={percent}
                    instrumentSymbol={instrumentSymbol}
                    caption={t`Total return`}
                    testID={BrokerageSelector.GainLine}
                />
            )}
        </LoadingContent>
    );
};
