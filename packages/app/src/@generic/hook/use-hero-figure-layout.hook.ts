import { useAtomValue } from '@effect/atom-react/Hooks';
import { use, useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { HERO_FIGURE_METRICS } from '../constant/hero-figure-metrics.constant';
import { HeroFigureLockContext } from '../context/hero-figure-lock.context';
import { splitHeroAmount } from '../utils/split-hero-amount.util';

import type { HeroFigureWidthsInterface } from '../interface/hero-figure-widths.interface';
import type { LayoutChangeEvent } from 'react-native';

const INITIAL_WIDTHS: HeroFigureWidthsInterface = { container: 0, extras: 0, natural: 0, lock: 0 };

export const useHeroFigureLayout = (amount: number, currencySymbol: string, decimalPlaces: number | undefined) => {
    const settingDecimalPlaces = useAtomValue(decimalPlacesAtom);
    const { decimalSeparator } = useLocaleInfo();
    const lock = use(HeroFigureLockContext);
    const formatWhole = useFormatDigits(0);
    const formatCompact = useFormatCompactDigits(THOUSAND);
    const [widths, setWidths] = useState<HeroFigureWidthsInterface>(INITIAL_WIDTHS);

    const splitLabel = (value: number) => {
        const { sign, whole, fraction } = splitHeroAmount(value, decimalPlaces ?? settingDecimalPlaces, decimalSeparator);

        return { whole: `${sign}${formatWhole(whole, currencySymbol)}`, fraction };
    };

    const handleLayout = (key: keyof HeroFigureWidthsInterface) => (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;

        setWidths(previous => (previous[key] === width ? previous : { ...previous, [key]: width }));
    };

    const availableWidth = widths.container - widths.extras;
    const getFitScale = (width: number) =>
        isPositiveNumber(width) && isPositiveNumber(widths.container)
            ? Math.min(Math.max(availableWidth / width, HERO_FIGURE_METRICS.floorScale), 1)
            : 1;

    const label = splitLabel(amount);
    const lockedScale = isDefined(lock) ? getFitScale(widths.lock) : null;
    const scale = lockedScale ?? getFitScale(widths.natural);
    const isOverflowing =
        isDefined(lockedScale) &&
        isPositiveNumber(widths.lock) &&
        widths.natural > widths.lock &&
        widths.natural * lockedScale > availableWidth;

    return {
        whole: isOverflowing ? formatCompact(amount, currencySymbol) : label.whole,
        fraction: scale > HERO_FIGURE_METRICS.floorScale && !isOverflowing ? label.fraction : '',
        size: HERO_FIGURE_METRICS.fontSize * scale,
        minimumFontScale: HERO_FIGURE_METRICS.floorScale / scale,
        label,
        lockLabel: isDefined(lock) ? splitLabel(lock.amount) : null,
        isLockApproximate: lock?.approximate ?? false,
        spacerWidth: widths.extras + widths.natural,
        handleContainerLayout: handleLayout('container'),
        handleExtrasLayout: handleLayout('extras'),
        handleNaturalLayout: handleLayout('natural'),
        handleLockLayout: handleLayout('lock')
    };
};
