import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GainLine } from '../../../@generic/component/gain-line/gain-line';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { BrokerageSelector } from '../../selector/brokerage.selector';

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
                    <Trans>Some prices are unavailable, so this total is incomplete</Trans>
                </Text>
            ) : (
                <GainLine
                    gain={gain}
                    percent={percent}
                    suffix={t`total return`}
                    instrumentSymbol={instrumentSymbol}
                    testID={BrokerageSelector.GainLine}
                />
            )}
        </LoadingContent>
    );
};
