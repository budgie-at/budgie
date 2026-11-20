import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ScrollableSheetCard } from '../../../@generic/component/scrollable-sheet-card/scrollable-sheet-card';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { groupYieldEstimateCauses } from '../../utils/group-yield-estimate-causes.util';
import { YieldInfoSheetBlock } from '../yield-info-sheet-block/yield-info-sheet-block';

import type { YieldScreenKeyInterface } from '../../interface/yield-screen-key.interface';

interface Props {
    readonly screenKey: YieldScreenKeyInterface;
}

const BOTTOM_PADDING = 24;

export const YieldInfoSheetContent = ({ screenKey }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { formatMonthAndDay } = useFormatDate();
    const { formatRangeCaption } = useYieldDateLabels();
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const caption = isDefined(summary) ? formatRangeCaption(screenKey.key.range, summary.windowStart) : '';
    const earnedText = t`Earned ${caption}. The change compares the same number of periods just before. Before tax; valued at the day’s opening price, or the latest earlier price, marked ≈.`;
    const holdingCount = summary?.annualYield.holdingCount ?? 0;
    const yieldText = t({
        message: plural(holdingCount, {
            one: 'Yield uses the last 365 days across the # holding that has a rate. Crypto is measured on your whole balance, staked or not. Distributions count as income, not yield. Holdings marked “No yield” are left out.',
            other: 'Yield uses the last 365 days across the # holdings that have a rate. Crypto is measured on your whole balance, staked or not. Distributions count as income, not yield. Holdings marked “No yield” are left out.'
        })
    });
    const projectedText = t`At today’s balances and rates. Holdings left out of yield are not projected.`;
    const bottomSpacerStyle = { height: bottom + BOTTOM_PADDING };
    const causes = groupYieldEstimateCauses(summary?.estimateCauses ?? []).map(cause => {
        const days = t({ message: plural(cause.dayCount, { one: '# day', other: '# days' }) });
        const { instrumentCode } = cause;
        const sourceDay = isDefined(cause.sourceDay) ? formatMonthAndDay(parseISO(cause.sourceDay)) : null;

        return isDefined(sourceDay)
            ? t`${instrumentCode}: ${days} estimated from the ${sourceDay} price`
            : t`${instrumentCode}: ${days} estimated from the latest rate`;
    });

    return (
        <ScrollableSheetCard
            header={
                <View className="px-xl pb-lg">
                    <SheetTitleRow title={t`About these figures`} trailing={<View />} />
                </View>
            }
            ratio={MORPHING_SHEET_DESTINATION_HEIGHT_RATIO}
            contentClassName="gap-y-lg px-3xl"
            testID={PassiveIncomeSelector.InfoSheet}
        >
            <YieldInfoSheetBlock title={t`Earned`} body={earnedText} />
            <YieldInfoSheetBlock title={t`Yield`} body={yieldText} />
            <YieldInfoSheetBlock title={t`Projected`} body={projectedText} />
            <YieldInfoSheetBlock title={t`Estimates`} body={t`≈ means the price was estimated.`}>
                {isNotEmptyArray(causes) ? (
                    <View className="gap-y-xs">
                        {causes.map(cause => (
                            <Text key={cause} className="text-[15px] leading-[20px] text-secondary-foreground">
                                {cause}
                            </Text>
                        ))}
                    </View>
                ) : null}
            </YieldInfoSheetBlock>
            <View style={bottomSpacerStyle} />
        </ScrollableSheetCard>
    );
};
