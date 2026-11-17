import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { RETURN_ARROW_BY_DIRECTION } from '../../../brokerage/constant/return-arrow-by-direction.constant';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';

import type { PortfolioReturnInterface } from '../../../brokerage/interface/portfolio-return.interface';

interface Props {
    readonly sectionReturn: Pick<PortfolioReturnInterface, 'percent'> | undefined;
    readonly todayReturn: Pick<PortfolioReturnInterface, 'percent'> | undefined;
    readonly isLoading: boolean;
    readonly testID: string;
}

const PLACEHOLDER_PERCENT = 9.9999;
const PERCENT_DISPLAY_STEPS = 10_000;

const PILL_CLASS_BY_DIRECTION: Readonly<Record<number, string>> = {
    [-1]: 'bg-destructive-background',
    0: 'bg-secondary-corner',
    1: 'bg-positive-background'
};
const LABEL_CLASS_BY_DIRECTION: Readonly<Record<number, string>> = {
    [-1]: 'text-destructive-strong',
    0: 'text-primary/70',
    1: 'text-positive-strong'
};
const continuousBorder = { borderCurve: 'continuous' as const };

export const HomeSectionReturnPill = ({ sectionReturn, todayReturn, isLoading, testID }: Props) => {
    const { t } = useLingui();
    const formatGainPercent = useFormatGainPercent();
    const isAmountProtected = useIsAmountProtected();

    const percent = [sectionReturn, todayReturn].map(candidate => candidate?.percent).find(isDefined);
    const isToday = isDefined(percent) && !isDefined(sectionReturn?.percent);
    const isPending = isLoading && !isDefined(percent);

    if (!isDefined(percent) && !isPending) {
        return null;
    }

    const direction = isAmountProtected ? 0 : Math.sign(Math.round((percent ?? 0) * PERCENT_DISPLAY_STEPS));
    const change = formatGainPercent(percent ?? PLACEHOLDER_PERCENT);
    const spokenChange = isPending ? t`loading` : { [-1]: t`down ${change}`, 0: t`unchanged`, 1: t`up ${change}` }[direction];
    const spokenLabel = isToday ? t`Past 24 hours, ${spokenChange}` : t`Total return, ${spokenChange}`;
    const arrow = RETURN_ARROW_BY_DIRECTION[isPending ? 1 : direction];
    const todaySuffix = isToday ? (
        <Text
            numberOfLines={1}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className={cn('text-[11px] font-medium', LABEL_CLASS_BY_DIRECTION[direction])}
        >
            <Trans>24h</Trans>
        </Text>
    ) : null;

    return (
        <View
            accessible={!isAmountProtected}
            accessibilityLabel={spokenLabel}
            className={cn('shrink-0 flex-row items-center rounded-full px-[7px] py-[2px]', PILL_CLASS_BY_DIRECTION[direction])}
            style={continuousBorder}
        >
            <LoadingContent isLoading={isPending} loadingIndicator={null} className="flex-row items-center gap-x-[3px]">
                <ProtectedText
                    numberOfLines={1}
                    maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                    className={cn('text-[13px] font-semibold tabular-nums', LABEL_CLASS_BY_DIRECTION[direction])}
                    testID={testID}
                >
                    {arrow}
                    {change}
                </ProtectedText>
                {todaySuffix}
            </LoadingContent>
        </View>
    );
};
