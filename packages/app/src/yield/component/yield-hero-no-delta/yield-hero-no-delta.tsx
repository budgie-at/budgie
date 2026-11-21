import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;

export const YieldHeroNoDelta = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    const { range } = screenKey.key;
    const hasEarlierPeriod =
        range !== YieldRangeEnum.ALL && isDefined(summary.firstYieldDay) && summary.firstYieldDay < summary.windowStart;
    const previousPeriods: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`No payouts in previous 30 days`,
        [YieldRangeEnum.QUARTER]: t`No payouts in previous 3 months`,
        [YieldRangeEnum.YEAR]: t`No payouts in previous 12 months`,
        [YieldRangeEnum.ALL]: t`No earlier period to compare`
    };
    const text = hasEarlierPeriod ? previousPeriods[range] : t`No earlier period to compare`;

    return (
        <View className="min-h-[22px] justify-center">
            <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}>
                {text}
            </Text>
        </View>
    );
};
