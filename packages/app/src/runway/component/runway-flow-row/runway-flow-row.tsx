import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { getRunwayAmountVariant } from '../../utils/get-runway-amount-variant.util';
import { RunwayFlowCell } from '../runway-flow-cell/runway-flow-cell';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

export const RunwayFlowRow = ({ computation }: Props) => {
    const { t } = useLingui();
    const net = convertFromMicroUnits(computation.net);

    return (
        <Card size="md" className="flex-row items-center">
            <RunwayFlowCell label={t`Expenses`} amount={convertFromMicroUnits(computation.burn)} variant="primary" />
            <View className="h-8 w-px bg-secondary-corner" />
            <RunwayFlowCell label={t`Income`} amount={convertFromMicroUnits(computation.income)} variant="primary" />
            <View className="h-8 w-px bg-secondary-corner" />
            <RunwayFlowCell label={t`Net`} amount={net} variant={getRunwayAmountVariant(net)} />
        </Card>
    );
};
