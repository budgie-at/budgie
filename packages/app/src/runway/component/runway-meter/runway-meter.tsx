import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';
import { View } from 'react-native';

import { GrowBar } from '../../../@generic/component/grow-bar/grow-bar';
import { STATUS_TONE_FILL_CLASS_NAME } from '../../../@generic/constant/status-tone-fill-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';
import { RunwayMeterTick } from '../runway-meter-tick/runway-meter-tick';

import type { StatusToneType } from '../../../@generic/type/status-tone.type';

interface Props {
    readonly months: number | null;
    readonly tone: Extract<StatusToneType, 'positive' | 'destructive'>;
}

export const RunwayMeter = ({ months, tone }: Props) => {
    const ratio = Math.min(Math.max(months ?? 0, 0), RUNWAY_MAX_MONTHS) / RUNWAY_MAX_MONTHS;

    return (
        <View>
            <View className="h-2 overflow-hidden rounded-full bg-secondary-corner">
                <GrowBar ratio={ratio} className={cn('h-full rounded-full', STATUS_TONE_FILL_CLASS_NAME[tone])} />
            </View>

            <View className="relative mt-sm h-4">
                {RUNWAY_HORIZON_MONTHS.map((tick, index) => (
                    <RunwayMeterTick key={tick} index={index} />
                ))}
            </View>
        </View>
    );
};
