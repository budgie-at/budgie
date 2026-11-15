import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const HIT_SLOP = 6;
const ICON_SIZE = 16;

export const YieldChartModeControl = () => {
    const { t } = useLingui();
    const { mode, setMode } = use(YieldScreenContext);

    const isBars = mode === YieldChartModeEnum.BARS;
    const barsState = { selected: isBars };
    const runningState = { selected: !isBars };

    const handleBars = () => void setMode(YieldChartModeEnum.BARS);
    const handleRunning = () => void setMode(YieldChartModeEnum.RUNNING_TOTAL);

    return (
        <View className="h-[32px] flex-row rounded-full bg-grouped-surface-row p-[2px]">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t`Per period`}
                accessibilityState={barsState}
                hitSlop={HIT_SLOP}
                onPress={handleBars}
                testID={PassiveIncomeSelector.Mode(YieldChartModeEnum.BARS)}
                className={cn('w-[40px] items-center justify-center rounded-full', isBars && 'bg-surface-row-opaque')}
            >
                <Icon icon={UserIconNameEnum.ChartColumn} size={ICON_SIZE} className="text-primary" />
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t`Running total`}
                accessibilityState={runningState}
                hitSlop={HIT_SLOP}
                onPress={handleRunning}
                testID={PassiveIncomeSelector.Mode(YieldChartModeEnum.RUNNING_TOTAL)}
                className={cn('w-[40px] items-center justify-center rounded-full', !isBars && 'bg-surface-row-opaque')}
            >
                <Icon icon={UserIconNameEnum.ChartLine} size={ICON_SIZE} className="text-primary" />
            </Pressable>
        </View>
    );
};
