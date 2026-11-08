import { TransactionEntryTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { AdjustmentSelector } from '../adjustment-account-summary/adjustment-account-summary.selector';

import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly details: Pick<AdjustmentTransactionDetailsInterface, 'isAmountReadOnly'>;
    readonly isIncrease: boolean;
    readonly onToggle: () => void;
}

export const AdjustmentDirection = ({ details, isIncrease, onToggle }: Props) => {
    const { t } = useLingui();

    if (details.isAmountReadOnly) {
        return (
            <Text className="text-center text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.3}>
                {t`Sync controls this adjustment. Only the note can be edited.`}
            </Text>
        );
    }

    const value = isIncrease ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
    const segments = [
        { value: TransactionEntryTypeEnum.CREDIT, label: t`Decrease`, testID: AdjustmentSelector.Decrease },
        { value: TransactionEntryTypeEnum.DEBIT, label: t`Increase`, testID: AdjustmentSelector.Increase }
    ];
    const handleChange = (nextValue: TransactionEntryTypeEnum) => {
        if (nextValue !== value) {
            onToggle();
        }
    };

    return <SegmentedControl segments={segments} value={value} onChange={handleChange} className="w-full" />;
};
