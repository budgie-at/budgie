import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { getMarketChangeSign } from '../utils/get-market-change-sign.util';
import { getMarketMoveClassName } from '../utils/get-market-move-class-name.util';
import { roundHalfExpand } from '../utils/round-half-expand.util';

const MIN_FRACTION_DIGITS = 2;
const PERCENT = 100;

const MAX_CHANGE_FRACTION_DIGITS = 12;
const SIGNIFICANT_FIGURES = 2;

const getMarketChangeFractionDigits = (delta: number, priceFractionDigits: number): number => {
    const magnitude = Math.abs(delta);

    if (magnitude === 0 || !Number.isFinite(magnitude)) {
        return priceFractionDigits;
    }

    const significantDigits = Math.ceil(-Math.log10(magnitude)) + SIGNIFICANT_FIGURES - 1;

    return Math.min(MAX_CHANGE_FRACTION_DIGITS, Math.max(priceFractionDigits, significantDigits));
};

export const useMarketPriceHeroChange = (price: number | undefined, basePrice: number | null, fractionDigits: number) => {
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const isTinyPrice = isDefined(price) && price < 1;
    const changeFractionDigits =
        isTinyPrice && isPositiveNumber(basePrice) ? getMarketChangeFractionDigits(price - basePrice, fractionDigits) : fractionDigits;
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, changeFractionDigits);
    const formatPercent = useFormatDigits(MIN_FRACTION_DIGITS);

    if (!isDefined(price) || !isPositiveNumber(basePrice)) {
        return { changeLabel: null, changeClassName: getMarketMoveClassName(0) };
    }

    const share = (price - basePrice) / basePrice;
    const change = isTinyPrice ? price - basePrice : roundHalfExpand(price, fractionDigits) - roundHalfExpand(basePrice, fractionDigits);
    const amountLabel = `${getMarketChangeSign(change)}${formatPrice(Math.abs(change), symbol)}`;
    const percentLabel = `${getMarketChangeSign(share)}${formatPercent(Math.abs(share * PERCENT))}%`;

    return { changeLabel: `${amountLabel} (${percentLabel}) `, changeClassName: getMarketMoveClassName(share) };
};
