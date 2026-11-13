import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
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
                <Text className="px-5xl text-center text-[15px] leading-[20px] text-secondary-foreground" maxFontSizeMultiplier={2}>
                    <Trans>Partial value — some prices unavailable</Trans>
                </Text>
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
