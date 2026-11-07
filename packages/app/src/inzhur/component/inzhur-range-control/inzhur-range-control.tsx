import { View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';

import type { SegmentedControlSegmentInterface } from '../../../@generic/interface/segmented-control-segment.interface';
import type { InzhurGainRangeEnum } from '@budgie/sync';

interface Props {
    readonly segments: readonly SegmentedControlSegmentInterface<InzhurGainRangeEnum>[];
    readonly value: InzhurGainRangeEnum;
    readonly onChange: (range: InzhurGainRangeEnum) => void;
}

export const InzhurRangeControl = ({ segments, value, onChange }: Props) => {
    const track = useCSSVariable('--color-segmented-track');

    const variables = { ...(isDefined(track) && { '--color-surface-fill': track }) };

    return (
        <ScopedVariables variables={variables}>
            <View className="w-[192px] self-center">
                <SegmentedControl segments={segments} value={value} onChange={onChange} />
            </View>
        </ScopedVariables>
    );
};
