import { InstrumentTypeEnum, convertToMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useCryptoInstrumentBalanceQuery } from '../../../account/query/use-crypto-instrument-balance.query';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCryptoInstrumentPositionQuery } from '../../query/use-crypto-instrument-position.query';
import { isMarketPriceStale } from '../../utils/is-market-price-stale.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionFooter } from '../currency-market-position-footer/currency-market-position-footer';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';
import { CurrencyMarketReturnRows } from '../currency-market-return-rows/currency-market-return-rows';
import { CurrencyMarketValueRow } from '../currency-market-value-row/currency-market-value-row';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>;
    readonly latestPriceDate: string | null;
}

const PRIMARY_VALUE_CLASSNAME = 'text-primary font-semibold';

export const CurrencyMarketPosition = ({ instrument, latestPriceDate }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { balance } = useCryptoInstrumentBalanceQuery(instrument.id);
    const position = useCryptoInstrumentPositionQuery(instrument.id, defaultInstrument.id);
    const valuationRate = useCryptoValuationRateQuery(instrument.id, defaultInstrument.id);
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const hasBalance = convertToMicroUnits(balance) !== 0;
    const totalAmount = formatInstrumentAmount(balance, instrument.code, InstrumentTypeEnum.CRYPTO);
    const isStale = isDefined(valuationRate) && isDefined(latestPriceDate) && isMarketPriceStale(latestPriceDate);
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
                        balance={balance}
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
        </GroupedListSection>
    );
};
