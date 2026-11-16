import { useAtomValue } from '@effect/atom-react/Hooks';
import { use, useState } from 'react';
import { PixelRatio } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { HERO_FIGURE_METRICS } from '../constant/hero-figure-metrics.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../constant/max-font-size-multiplier.constant';
import { HeroFigureScaleContext } from '../context/hero-figure-scale.context';
import { splitHeroAmount } from '../utils/split-hero-amount.util';

import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

export const useHeroFigureLayout = (amount: number, currencySymbol: string, decimalPlaces: number | undefined) => {
    const settingDecimalPlaces = useAtomValue(decimalPlacesAtom);
    const { decimalSeparator } = useLocaleInfo();
    const { locked, onMeasured } = use(HeroFigureScaleContext);
    const [measuredScale, setMeasuredScale] = useState(1);
    const formatWhole = useFormatDigits(0);
    const formatCompact = useFormatCompactDigits(THOUSAND);
    const { sign, whole, fraction } = splitHeroAmount(amount, decimalPlaces ?? settingDecimalPlaces, decimalSeparator);

    const fullLabel = `${sign}${formatWhole(whole, currencySymbol)}`;
    const isOverflowing = isDefined(locked) && fullLabel.length > locked.labelLength;
    const wholeLabel = isOverflowing ? formatCompact(amount, currencySymbol) : fullLabel;
    const figureSize = HERO_FIGURE_METRICS.fontSize * (locked?.scale ?? 1);
    const isAtFloor = (locked?.scale ?? measuredScale) <= HERO_FIGURE_METRICS.floorScale;
    const isFractionVisible = isNotEmptyString(fraction) && !isAtFloor && !isOverflowing;

    const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        const line = event.nativeEvent.lines.at(0);

        if (isDefined(locked) || !isDefined(line)) {
            return;
        }

        const fullHeight = HERO_FIGURE_METRICS.fontSize * Math.min(PixelRatio.getFontScale(), MAX_FONT_SIZE_MULTIPLIER);
        const ratio = Math.min(Math.max(line.height / fullHeight, HERO_FIGURE_METRICS.floorScale), 1);
        const scale = Math.round(ratio * HERO_FIGURE_METRICS.scalePrecision) / HERO_FIGURE_METRICS.scalePrecision;

        setMeasuredScale(scale);
        onMeasured({ scale, labelLength: fullLabel.length });
    };

    return { isLocked: isDefined(locked), wholeLabel, fraction: isFractionVisible ? fraction : '', figureSize, handleTextLayout };
};
