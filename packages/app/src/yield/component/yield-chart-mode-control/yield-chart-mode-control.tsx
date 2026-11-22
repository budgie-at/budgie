import { YieldBucketUnitEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const BUCKET_LABEL = {
    [YieldBucketUnitEnum.DAY]: msg`Per day`,
    [YieldBucketUnitEnum.WEEK]: msg`Per week`,
    [YieldBucketUnitEnum.MONTH]: msg`Per month`,
    [YieldBucketUnitEnum.QUARTER]: msg`Per quarter`,
    [YieldBucketUnitEnum.YEAR]: msg`Per year`
} as const;

export const YieldChartModeControl = () => {
    const { t } = useLingui();
    const { mode, setMode } = use(YieldScreenContext);
    const summary = useYieldSummary();

    const segments = [
        {
            value: YieldChartModeEnum.BARS,
            label: t(BUCKET_LABEL[summary?.bucketUnit ?? YieldBucketUnitEnum.MONTH]),
            testID: PassiveIncomeSelector.Mode(YieldChartModeEnum.BARS)
        },
        {
            value: YieldChartModeEnum.RUNNING_TOTAL,
            label: t`Running total`,
            testID: PassiveIncomeSelector.Mode(YieldChartModeEnum.RUNNING_TOTAL)
        }
    ];

    return (
        <SegmentedControl
            segments={segments}
            value={mode}
            onChange={setMode}
            pressFeedback={HapticPressFeedbackEnum.NONE}
            className="w-full"
        />
    );
};
