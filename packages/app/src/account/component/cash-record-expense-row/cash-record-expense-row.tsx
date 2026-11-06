import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';

import { CashRecordExpenseRowSelector } from './cash-record-expense-row.selector';

interface Props {
    readonly accountId: number;
}

export const CashRecordExpenseRow = ({ accountId }: Props) => {
    const cashSwatch = ACCOUNT_TYPE_SWATCH[AccountTypeEnum.CASH];

    const handleRecordExpense = () =>
        void router.push({ pathname: '/create-transaction/expense', params: { accountId: String(accountId) } });

    return (
        <TransactionRowSurface position={TransactionListRowPositionEnum.LAST} separatorInset={16}>
            <HapticPressable
                accessibilityRole="button"
                onPress={handleRecordExpense}
                className="min-h-[48px] flex-row items-center gap-x-sm pr-xl pl-3xl active:scale-100 active:bg-surface-fill"
                testID={CashRecordExpenseRowSelector.RecordExpense}
            >
                <ScaledIcon icon={UserIconNameEnum.Plus} size={16} className={cashSwatch.text} />
                <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className={cn('text-[15px] font-medium', cashSwatch.text)}>
                    <Trans>Record expense</Trans>
                </Text>
            </HapticPressable>
        </TransactionRowSurface>
    );
};
