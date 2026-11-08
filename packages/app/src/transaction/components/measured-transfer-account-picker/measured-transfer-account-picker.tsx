import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { useAnchoredMorphOriginPress } from '../../../@generic/hook/use-anchored-morph-origin-press.hook';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';

import type { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ComponentProps } from 'react';

type PickerProps = Omit<ComponentProps<typeof TransferAccountPicker>, 'onPress'>;

interface Props extends PickerProps {
    readonly edge: RoundedEdgeEnum;
    readonly onPress: (origin: AnchoredMorphOriginInterface) => void;
}

export const MeasuredTransferAccountPicker = ({ edge, onPress, ...pickerProps }: Props) => {
    const ghost = <TransferAccountPicker {...pickerProps} animatedStyle={void 0} onPress={emptyFn} />;

    const { ref, handlePress } = useAnchoredMorphOriginPress(edge, ghost, onPress);

    return (
        <View ref={ref} collapsable={false}>
            <TransferAccountPicker {...pickerProps} onPress={handlePress} />
        </View>
    );
};
