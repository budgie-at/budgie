import { YieldRangeEnum } from '@budgie/market';
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
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { groupYieldEstimateCauses } from '../../utils/group-yield-estimate-causes.util';
import { YieldInfoSheetBlock } from '../yield-info-sheet-block/yield-info-sheet-block';

import type { YieldScreenKeyInterface } from '../../interface/yield-screen-key.interface';

interface Props {
    readonly screenKey: YieldScreenKeyInterface;
}

const BOTTOM_PADDING = 8;

export const YieldInfoSheetContent = ({ screenKey }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { formatMonthAndDay } = useFormatDate();
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const isYear = screenKey.key.range === YieldRangeEnum.YEAR;
    const priorLabel = isYear ? t`Previous year` : t`Previous period`;
    const priorText = isYear ? t`The 12 months before this range.` : t`The same length of time just before this range.`;
    const earnedText = t`Income before tax. Crypto is valued at that day’s opening price.`;
    const yieldText = t`Yield uses the last 12 months across holdings with a rate. Crypto is measured on your whole balance, staked or not. Fund payouts aren’t counted in yield.`;
    const outlookText = t`At today’s balances and rates. Holdings left out of yield are not projected.`;
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
            <YieldInfoSheetBlock title={t`Outlook`} body={outlookText} />
            <YieldInfoSheetBlock title={t`Tax withheld`} body={t`Tax taken at source before payouts reach you.`} />
            <YieldInfoSheetBlock title={t`Net after tax`} body={t`Earned minus tax withheld.`} />
            <YieldInfoSheetBlock title={t`So far`} body={t`The current period isn’t over yet.`} />
            <YieldInfoSheetBlock title={priorLabel} body={priorText} />
            <YieldInfoSheetBlock title={t`Estimates`} body={t`≈ marks an estimate: a projection, or a value using an estimated price.`}>
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
