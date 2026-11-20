import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldChartModeControl = () => {
    const { t } = useLingui();
    const { mode, setMode } = use(YieldScreenContext);

    const segments = [
        { value: YieldChartModeEnum.BARS, label: t`Monthly`, testID: PassiveIncomeSelector.Mode(YieldChartModeEnum.BARS) },
        {
            value: YieldChartModeEnum.RUNNING_TOTAL,
            label: t`Cumulative`,
            testID: PassiveIncomeSelector.Mode(YieldChartModeEnum.RUNNING_TOTAL)
        }
    ];

    return (
        <SegmentedControl
            segments={segments}
            value={mode}
            onChange={setMode}
            pressFeedback={HapticPressFeedbackEnum.NONE}
            className="w-[220px] shrink-0"
        />
    );
};
