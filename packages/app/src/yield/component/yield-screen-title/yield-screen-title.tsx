import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const CLEAR_HIT_SLOP = 14;

export const YieldScreenTitle = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const handleClear = () => void router.setParams({ position: '', instrument: '', group: '', focus: '' });

    const { positionAccountId } = screenKey.key;
    const positionTitle = summary?.positions.find(position => position.accountId === positionAccountId)?.title;
    const instrumentCode = summary?.positions.at(0)?.instrumentCode ?? '';
    const scopeTitle = isDefined(positionAccountId) ? (positionTitle ?? '') : instrumentCode;
    const isFiltered = isDefined(screenKey.scopeId);
    const subtitle = isFiltered ? scopeTitle : t`All holdings`;

    return (
        <View className="gap-y-xs">
            <Text testID={PassiveIncomeSelector.Title} className="text-3xl font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            <View className="h-[20px] flex-row items-center gap-x-xs">
                <Text testID={PassiveIncomeSelector.Subtitle} className="text-xs text-secondary-foreground" numberOfLines={1}>
                    {subtitle}
                </Text>
                {isFiltered ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t`Show all holdings`}
                        hitSlop={CLEAR_HIT_SLOP}
                        onPress={handleClear}
                        testID={PassiveIncomeSelector.ClearFilter}
                    >
                        <Icon icon={UserIconNameEnum.CircleX} size={16} className="text-secondary-foreground" />
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
};
