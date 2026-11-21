import { Trans } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChipRow } from '../yield-filter-chip-row/yield-filter-chip-row';

interface Props {
    readonly hasYield: boolean;
}

export const YieldScreenTitle = ({ hasYield }: Props) => {
    const { screenKey } = use(YieldScreenContext);

    const isFiltered = isDefined(screenKey.scopeId) || isDefined(screenKey.key.group);
    const hasChip = isFiltered && hasYield;
    const isSubtitleVisible = !isFiltered && hasYield;

    return (
        <View className="grow shrink-0 justify-start gap-y-xs">
            <Text
                testID={PassiveIncomeSelector.Title}
                className="shrink-0 text-3xl font-semibold text-primary"
                {...CHROME_TITLE_TEXT_PROPS}
            >
                <Trans>Passive income</Trans>
            </Text>
            <View className="min-h-[36px] justify-center">
                {hasChip ? <YieldFilterChipRow /> : null}
                {isSubtitleVisible ? (
                    <Text testID={PassiveIncomeSelector.Subtitle} className="text-sm text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                        <Trans>All holdings</Trans>
                    </Text>
                ) : null}
            </View>
        </View>
    );
};
