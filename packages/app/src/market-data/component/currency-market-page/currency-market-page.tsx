import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
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

export const CurrencyMarketPage = ({ instrument }: Props) => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { latestPrice, prices } = useInstrumentMarketDataQuery(instrument.id, defaultInstrumentId);

    return (
        <GroupedSurface>
            <RevealGate isLoading={false}>
                <CollapsibleChromePage
                    leading={<HeaderBackButton />}
                    largeTitle={<CurrencyMarketLargeTitle instrument={instrument} />}
                    smallTitle={<CurrencyMarketSmallTitle instrument={instrument} />}
                    contentClassName="px-3xl gap-y-[28px] pb-8xl"
                >
                    <CurrencyMarketOverview instrument={instrument} prices={prices} />

                    <View testID={CurrencyMarketPageSelector.Holdings(instrument.code)}>
                        <CurrencyMarketPosition instrument={instrument} />
                    </View>

                    <CurrencyMarketAccounts instrument={instrument} />

                    <CurrencyMarketStats instrument={instrument} latestPrice={latestPrice} />
                </CollapsibleChromePage>
            </RevealGate>
        </GroupedSurface>
    );
};
