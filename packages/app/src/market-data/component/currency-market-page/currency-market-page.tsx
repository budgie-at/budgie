import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { SCREEN_CHROME_CONFIG } from '../../../@generic/constant/screen-chrome-config.constant';
import { getInstrumentUnitLabel } from '../../../instrument/utils/get-instrument-unit-label.util';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { useInstrumentMarketDataQuery } from '../../query/use-instrument-market-data.query';
import { CurrencyMarketAccounts } from '../currency-market-accounts/currency-market-accounts';
import { CurrencyMarketLargeTitle } from '../currency-market-large-title/currency-market-large-title';
import { CurrencyMarketOverview } from '../currency-market-overview/currency-market-overview';
import { CurrencyMarketPosition } from '../currency-market-position/currency-market-position';
import { CurrencyMarketSmallTitle } from '../currency-market-small-title/currency-market-small-title';
import { CurrencyMarketStats } from '../currency-market-stats/currency-market-stats';

import { CurrencyMarketPageSelector } from './currency-market-page.selector';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
}

const TITLE_HANDOFF_DISTANCE = 24;
const HERO_PRICE_HEIGHT = 41;
const CURRENCY_MARKET_CHROME_CONFIG = {
    ...SCREEN_CHROME_CONFIG,
    collapsedHeaderHeight: 44,
    smallTitleStart: 0,
    largeTitleEnd: TITLE_HANDOFF_DISTANCE,
    collapseEnd: TITLE_HANDOFF_DISTANCE
};

export const CurrencyMarketPage = ({ instrument: storedInstrument }: Props) => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { latestPrice, previousPrice, prices } = useInstrumentMarketDataQuery(
        storedInstrument.id,
        storedInstrument.quoteInstrumentId ?? defaultInstrumentId
    );

    const priceBottom = useSharedValue(HERO_PRICE_HEIGHT);

    const instrument = { ...storedInstrument, code: getInstrumentUnitLabel(storedInstrument) };

    return (
        <GroupedSurface>
            <RevealGate isLoading={false}>
                <CollapsibleChromePage
                    leading={<HeaderBackButton />}
                    largeTitle={<CurrencyMarketLargeTitle instrument={instrument} hasPrice={isDefined(latestPrice)} />}
                    smallTitle={
                        <CurrencyMarketSmallTitle instrumentName={instrument.name} latestPrice={latestPrice} priceBottom={priceBottom} />
                    }
                    chromeConfig={CURRENCY_MARKET_CHROME_CONFIG}
                    contentClassName="px-3xl gap-y-[28px] pb-8xl"
                >
                    <CurrencyMarketOverview instrument={instrument} prices={prices} priceBottom={priceBottom} />

                    <View testID={CurrencyMarketPageSelector.Holdings(instrument.code)}>
                        <CurrencyMarketPosition instrument={instrument} latestPrice={latestPrice} />
                    </View>

                    <CurrencyMarketAccounts instrument={instrument} />

                    <CurrencyMarketStats instrument={instrument} latestPrice={latestPrice} previousPrice={previousPrice} />
                </CollapsibleChromePage>
            </RevealGate>
        </GroupedSurface>
    );
};
