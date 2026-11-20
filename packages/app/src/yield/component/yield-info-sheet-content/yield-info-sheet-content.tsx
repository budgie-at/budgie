import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { ScrollableSheetCard } from '../../../@generic/component/scrollable-sheet-card/scrollable-sheet-card';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { groupYieldEstimateCauses } from '../../utils/group-yield-estimate-causes.util';

import type { YieldScreenKeyInterface } from '../../interface/yield-screen-key.interface';

interface Props {
    readonly screenKey: YieldScreenKeyInterface;
}

export const YieldInfoSheetContent = ({ screenKey }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const { formatRangeCaption } = useYieldDateLabels();
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const caption = isDefined(summary) ? formatRangeCaption(screenKey.key.range, summary.windowStart) : '';
    const periodText = t`Earned ${caption}. The change compares the same number of periods just before, with the last one cut to the same point.`;
    const holdingCount = summary?.annualYield.holdingCount ?? 0;
    const yieldText = t({
        message: plural(holdingCount, {
            one: 'Yield uses the last 365 days across # holding. Crypto yield is measured on your whole balance, staked or not.',
            other: 'Yield uses the last 365 days across # holdings. Crypto yield is measured on your whole balance, staked or not.'
        })
    });
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
            header={<FormsheetHeader size="md" title={t`About these figures`} />}
            ratio={MORPHING_SHEET_DESTINATION_HEIGHT_RATIO}
            contentClassName="gap-y-lg px-3xl pb-3xl"
            testID={PassiveIncomeSelector.InfoSheet}
        >
            <Text className="text-md text-primary">{periodText}</Text>
            <Text className="text-md text-primary">
                <Trans>
                    Earned is before tax. Rewards are valued at the day’s opening price. When that day has no price, the latest earlier
                    price is used and the figure is marked ≈.
                </Trans>
            </Text>
            <Text className="text-md text-primary">{yieldText}</Text>
            <Text className="text-md text-primary">
                <Trans>
                    Distributions count as income but not in the yield. Holdings marked “Not in yield” are left out of the yield and of
                    “Next 12 months”.
                </Trans>
            </Text>
            <Text className="text-md text-primary">
                <Trans>In Analytics, the small bars are scaled to each period.</Trans>
            </Text>
            {isNotEmptyArray(causes) ? (
                <View className="gap-y-xs">
                    <Text className="text-md font-semibold text-primary">
                        <Trans>≈ includes estimated values</Trans>
                    </Text>
                    {causes.map(cause => (
                        <Text key={cause} className="text-sm text-secondary-foreground">
                            {cause}
                        </Text>
                    ))}
                </View>
            ) : null}
        </ScrollableSheetCard>
    );
};
