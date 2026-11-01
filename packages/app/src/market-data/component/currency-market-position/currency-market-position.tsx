import { convertToMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useCryptoInstrumentBalanceQuery } from '../../../account/query/use-crypto-instrument-balance.query';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCryptoInstrumentPositionQuery } from '../../query/use-crypto-instrument-position.query';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionFooter } from '../currency-market-position-footer/currency-market-position-footer';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';
import { CurrencyMarketReturnRows } from '../currency-market-return-rows/currency-market-return-rows';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>;
}

const PRIMARY_VALUE_CLASSNAME = 'text-primary font-semibold';

export const CurrencyMarketPosition = ({ instrument }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { balance } = useCryptoInstrumentBalanceQuery(instrument.id);
    const position = useCryptoInstrumentPositionQuery(instrument.id, defaultInstrument.id);
    const valuationRate = useCryptoValuationRateQuery(instrument.id, defaultInstrument.id);
    const formatMoney = useDisplayFormatDigits();
    const formatCrypto = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    const { code } = instrument;
    const hasBalance = convertToMicroUnits(balance) !== 0;
    const totalAmount = `${formatCrypto(balance)} ${code}`;
    const valueLabel = isDefined(valuationRate) ? formatMoney(balance * valuationRate, defaultInstrument.symbol) : t`No price`;
    const valueClassName = isDefined(valuationRate) ? PRIMARY_VALUE_CLASSNAME : 'text-secondary-foreground';
    const footer = hasBalance ? <CurrencyMarketPositionFooter position={position} balance={balance} instrumentCode={code} /> : null;

    return (
        <GroupedListSection title={t`Your position`} footer={footer}>
            <CurrencyMarketPositionRow
                label={t`Balance`}
                value={totalAmount}
                valueClassName={PRIMARY_VALUE_CLASSNAME}
                testID={CurrencyMarketPageSelector.HoldingsBalance(code)}
            />
            {hasBalance ? (
                <>
                    <CurrencyMarketPositionRow
                        label={t`Value`}
                        value={valueLabel}
                        valueClassName={valueClassName}
                        testID={CurrencyMarketPageSelector.HoldingsValue(code)}
                    />
                    <CurrencyMarketReturnRows position={position} valuationRate={valuationRate} instrumentCode={code} />
                </>
            ) : null}
        </GroupedListSection>
    );
};
