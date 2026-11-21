import { Trans } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldKindFilterChip } from '../yield-kind-filter-chip/yield-kind-filter-chip';
import { YieldScopeFilterChip } from '../yield-scope-filter-chip/yield-scope-filter-chip';

interface Props {
    readonly hasYield: boolean;
}

export const YieldScreenTitle = ({ hasYield }: Props) => {
    const { screenKey } = use(YieldScreenContext);

    const { group } = screenKey.key;
    const isFiltered = isDefined(screenKey.scopeId) || isDefined(group);
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
                {hasChip ? (
                    <View className="h-[36px] flex-row items-center gap-x-sm">
                        {isDefined(screenKey.scopeId) ? <YieldScopeFilterChip /> : null}
                        {isDefined(group) ? <YieldKindFilterChip group={group} /> : null}
                    </View>
                ) : null}
                {isSubtitleVisible ? (
                    <Text testID={PassiveIncomeSelector.Subtitle} className="text-sm text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                        <Trans>All holdings</Trans>
                    </Text>
                ) : null}
            </View>
        </View>
    );
};
