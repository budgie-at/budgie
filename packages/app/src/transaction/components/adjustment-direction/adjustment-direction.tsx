import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { AmountSignPill } from '../../../@generic/component/amount-sign-pill/amount-sign-pill';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: Pick<AdjustmentTransactionDetailsInterface, 'isReconciliation'>;
    readonly isIncrease: boolean;
    readonly onToggle: () => void;
}

export const AdjustmentDirection = ({ details, isIncrease, onToggle }: Props) => {
    const { t } = useLingui();

    if (details.isReconciliation) {
        return (
            <Text className="text-center text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                {t`Sync controls this adjustment. Only the note can be edited.`}
            </Text>
        );
    }

    return <AmountSignPill isIncrease={isIncrease} onToggle={onToggle} />;
};
