import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { useRefundedLabel } from '../../hook/use-refunded-label.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onPress?: () => void;
    readonly testID?: string;
}

export const RefundedPill = ({ transaction, onPress, testID }: Props) => {
    const label = useRefundedLabel(transaction);

    if (!isDefined(label)) {
        return null;
    }

    return <MetaPill label={label} icon={UserIconNameEnum.RotateCcw} onPress={onPress} testID={testID} />;
};
