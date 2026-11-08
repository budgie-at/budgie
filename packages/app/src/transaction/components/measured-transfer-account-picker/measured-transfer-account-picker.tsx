import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { emptyFn, isNumber, isString } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useMeasureInWindowPress } from '../../../@generic/hook/use-measure-in-window-press.hook';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ComponentProps } from 'react';

type PickerProps = Omit<ComponentProps<typeof TransferAccountPicker>, 'onPress'>;

interface Props extends PickerProps {
    readonly edge: RoundedEdgeEnum;
    readonly onPress: (origin: AnchoredMorphOriginInterface) => void;
}

export const MeasuredTransferAccountPicker = ({ edge, onPress, ...pickerProps }: Props) => {
    const { borderRadius: resolvedRadius } = useResolveClassNames('rounded-3xl');
    const { backgroundColor } = useResolveClassNames('bg-surface-row');

    const borderRadius = isNumber(resolvedRadius) ? resolvedRadius : 0;
    const topRadius = edge === RoundedEdgeEnum.TOP ? borderRadius : 0;
    const bottomRadius = edge === RoundedEdgeEnum.BOTTOM ? borderRadius : 0;
    const color = isString(backgroundColor) ? backgroundColor : 'transparent';
    const ghost = <TransferAccountPicker {...pickerProps} animatedStyle={void 0} onPress={emptyFn} />;

    const { ref, handlePress } = useMeasureInWindowPress(rect => {
        onPress({
            rect,
            color,
            content: ghost,
            radii: { topLeft: topRadius, topRight: topRadius, bottomLeft: bottomRadius, bottomRight: bottomRadius }
        });
    });

    return (
        <View ref={ref} collapsable={false}>
            <TransferAccountPicker {...pickerProps} onPress={handlePress} />
        </View>
    );
};
