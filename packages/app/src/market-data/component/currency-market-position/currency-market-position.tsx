import { InstrumentTypeEnum, convertToMicroUnits } from '@budgie/contracts';
import { calculateInstrumentPosition } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useUnitInstrumentBalanceQuery } from '../../../account/query/use-unit-instrument-balance.query';
import { useUnitValuationRateQuery } from '../../../exchange-rate/query/use-unit-valuation-rate.query';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useInstrumentPositionsQuery } from '../../query/use-instrument-positions.query';
import { isMarketPriceStale } from '../../utils/is-market-price-stale.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionFooter } from '../currency-market-position-footer/currency-market-position-footer';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';
import { CurrencyMarketRealizedReturnRow } from '../currency-market-realized-return-row/currency-market-realized-return-row';
import { CurrencyMarketReturnRows } from '../currency-market-return-rows/currency-market-return-rows';
import { CurrencyMarketValueRow } from '../currency-market-value-row/currency-market-value-row';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>;
    readonly latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price' | 'priceDate' | 'quoteInstrumentId'> | undefined;
}

const PRIMARY_VALUE_CLASSNAME = 'text-primary font-semibold';

export const CurrencyMarketPosition = ({ instrument, latestPrice }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { balance } = useUnitInstrumentBalanceQuery(instrument.id);
    const position = useInstrumentPositionsQuery([instrument.id], defaultInstrument.id).at(0) ?? calculateInstrumentPosition([]);
    const valuationRate = useUnitValuationRateQuery(instrument.id, defaultInstrument.id);
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const hasBalance = convertToMicroUnits(balance) !== 0;
    const totalAmount = formatInstrumentAmount(balance, instrument.code, InstrumentTypeEnum.CRYPTO);
    const isStale = isDefined(valuationRate) && isDefined(latestPrice) && isMarketPriceStale(latestPrice.priceDate);
    const staleNote = isStale ? t`At last known price` : null;
    const footer = hasBalance ? <CurrencyMarketPositionFooter costBasis={position.costBasis} valuationRate={valuationRate} /> : null;

    return (
        <GroupedListSection title={t`Your position`} footer={footer}>
            <CurrencyMarketPositionRow
                label={t`Balance`}
                value={totalAmount}
                valueClassName={PRIMARY_VALUE_CLASSNAME}
                testID={CurrencyMarketPageSelector.HoldingsBalance(instrument.code)}
            />
            {hasBalance && isDefined(valuationRate) ? (
                <>
                    <CurrencyMarketValueRow
                        latestPrice={latestPrice}
                        balance={balance}
                        positionAmount={position.amount}
                        valuationRate={valuationRate}
                        instrumentCode={instrument.code}
                        isStale={isStale}
                    />
                    <CurrencyMarketReturnRows
                        position={position}
                        valuationRate={valuationRate}
                        balance={balance}
                        instrumentCode={instrument.code}
                        staleNote={staleNote}
                    />
                </>
            ) : null}
            {convertToMicroUnits(position.realizedProfitLoss) === 0 ? null : (
                <CurrencyMarketRealizedReturnRow realizedProfitLoss={position.realizedProfitLoss} instrumentCode={instrument.code} />
            )}
        </GroupedListSection>
    );
};
