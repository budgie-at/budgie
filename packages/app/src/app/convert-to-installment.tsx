import { Stack } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { ConvertToInstallmentContent } from '../installment-plan/component/convert-to-installment-content/convert-to-installment-content';
import {
    useConvertToInstallmentModal,
    useConvertToInstallmentModalParams
} from '../installment-plan/context/convert-to-installment-modal.context';

import { ConvertToInstallmentModalSelector } from './convert-to-installment-modal.selector';

export default function ConvertToInstallmentModal() {
    const [, resolveConvertToInstallment, dismissConvertToInstallment] = useConvertToInstallmentModal();
    const currentParams = useConvertToInstallmentModalParams();
    const screenOptions = useModalRouteState(currentParams, dismissConvertToInstallment);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <View className="bg-sheet-surface" collapsable={false} testID={ConvertToInstallmentModalSelector.Page}>
            <Stack.Screen options={screenOptions} />
            <ConvertToInstallmentContent params={currentParams} onResolve={resolveConvertToInstallment} />
        </View>
    );
}
