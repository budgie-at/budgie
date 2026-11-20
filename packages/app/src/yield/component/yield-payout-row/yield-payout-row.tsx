import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { getTransactionDisplayTitle } from '../../../transaction/utils/get-transaction-display-title.util';
import { getTransactionHref } from '../../../transaction/utils/get-transaction-href.util';
import { YIELD_KIND_LABEL } from '../../constant/yield-kind-label.constant';
import { YIELD_SOURCE_FOCUS } from '../../constant/yield-source-focus.constant';
import { useYieldPayoutAmount } from '../../hook/use-yield-payout-amount.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldPayoutIcon } from '../yield-payout-icon/yield-payout-icon';
import { YieldRow } from '../yield-row/yield-row';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly isUnassigned: boolean;
    readonly rowPosition: TransactionListRowPositionEnum;
}

const SEPARATOR_INSET = 64;
const AMOUNT_CLASSNAME = 'text-[17px] font-semibold tabular-nums';
const TAX_CLASSNAME = 'text-secondary-foreground';
const INCOME_CLASSNAME = 'text-primary';

export const YieldPayoutRow = ({ transaction, isUnassigned, rowPosition }: Props) => {
    const { t } = useLingui();

    const handlePress = () => {
        if (isUnassigned && transaction.type === TransactionTypeEnum.INCOME) {
            router.push({ pathname: '/transactions/[id]/income', params: { id: String(transaction.id), focus: YIELD_SOURCE_FOCUS } });

            return;
        }

        router.push(getTransactionHref(transaction));
    };

    const kind = transaction.yieldKind ?? YieldKindEnum.NONE;
    const isTax = kind === YieldKindEnum.TAX;
    const trailingText = useYieldPayoutAmount(transaction, isTax);
    const account = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;
    const kindLabel = t(YIELD_KIND_LABEL[kind]);
    const subtitle = isNotEmptyString(account?.title) ? `${kindLabel} · ${account.title}` : kindLabel;
    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : kindLabel;
    const amountClassName = cn(AMOUNT_CLASSNAME, isTax ? TAX_CLASSNAME : INCOME_CLASSNAME);

    return (
        <TransactionRowSurface position={rowPosition} separatorInset={SEPARATOR_INSET}>
            <YieldRow
                left={<YieldPayoutIcon kind={kind} />}
                title={title}
                subtitle={subtitle}
                trailing={<Text className={amountClassName}>{trailingText}</Text>}
                accessibilityLabel={`${title}, ${subtitle}, ${trailingText}`}
                onPress={handlePress}
                testID={PassiveIncomeSelector.Payout(transaction.id)}
            />
        </TransactionRowSurface>
    );
};
