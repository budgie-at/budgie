import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: Pick<TransactionWithRelationsEntityInterface, 'consolidationType' | 'consolidationParentTransactionId'>;
    readonly onDelete: () => unknown;
}

export const TransactionInfoDeleteRow = ({ transaction, onDelete }: Props) => {
    const { t } = useLingui();
    const isRefundSource = isDefined(transaction.consolidationParentTransactionId);
    const deleteLabel = isDefined(transaction.consolidationType) ? t`Unconsolidate` : t`Delete Transaction`;
    const label = isRefundSource ? t`Undo refund` : deleteLabel;
    const handleDelete = () => void onDelete();

    return (
        <TransactionInfoGroup>
            <HapticPressable
                className="min-h-[50px] px-3xl py-xl items-center justify-center active:scale-100 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={handleDelete}
                testID={TransactionInfoPageSelector.DeleteButton}
            >
                <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    className="text-[17px] leading-[22px] text-destructive-strong"
                >
                    {label}
                </Text>
            </HapticPressable>
        </TransactionInfoGroup>
    );
};
