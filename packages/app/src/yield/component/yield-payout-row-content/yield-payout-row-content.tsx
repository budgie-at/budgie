import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { use } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { getTransactionHref } from '../../../transaction/utils/get-transaction-href.util';
import { YIELD_SOURCE_FOCUS } from '../../constant/yield-source-focus.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldPayoutRowText } from '../../hook/use-yield-payout-row-text.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldPayoutIcon } from '../yield-payout-icon/yield-payout-icon';
import { YieldPayoutTrailing } from '../yield-payout-trailing/yield-payout-trailing';
import { YieldRowSubtitle } from '../yield-row-subtitle/yield-row-subtitle';
import { YieldRow } from '../yield-row/yield-row';

import type { YieldPayoutRowPropsInterface } from '../../interface/yield-payout-row-props.interface';

interface Props extends YieldPayoutRowPropsInterface {
    readonly className?: string;
}

const AMOUNT_CLASSNAME = 'text-[17px] font-semibold tabular-nums';
const TAX_CLASSNAME = 'text-secondary-foreground';
const INCOME_CLASSNAME = 'text-primary';

export const YieldPayoutRowContent = ({ transaction, tax, siblings, isUnassigned, dateFormat, className }: Props) => {
    const { kind, cryptoCode, isTax, isMerged, title, subtitle, trailingText, taxText } = useYieldPayoutRowText(
        transaction,
        tax,
        siblings,
        dateFormat
    );

    const { screenKey } = use(YieldScreenContext);

    const sourceAccountId = transaction.yieldSourceAccountId;

    const canDrillDown = isMerged && isDefined(sourceAccountId) && !isDefined(screenKey.key.positionAccountId);

    const handlePress = () => {
        if (canDrillDown) {
            router.setParams({ position: String(sourceAccountId), instrument: '', group: '' });

            return;
        }

        if (isUnassigned && transaction.type === TransactionTypeEnum.INCOME) {
            router.push({ pathname: '/transactions/[id]/income', params: { id: String(transaction.id), focus: YIELD_SOURCE_FOCUS } });

            return;
        }

        router.push(getTransactionHref(transaction));
    };

    const onPress = isMerged && !canDrillDown ? null : handlePress;
    const rowClassName = cn(isMerged && 'min-h-[64px]', className);
    const amountClassName = cn(AMOUNT_CLASSNAME, isTax ? TAX_CLASSNAME : INCOME_CLASSNAME);

    const trailing = <YieldPayoutTrailing amount={trailingText} amountClassName={amountClassName} taxText={taxText} />;

    return (
        <YieldRow
            left={<YieldPayoutIcon kind={kind} cryptoCode={cryptoCode} />}
            title={title}
            className={rowClassName}
            subtitle={<YieldRowSubtitle subtitle={subtitle} />}
            trailing={trailing}
            accessibilityLabel={[title, subtitle, trailingText, taxText].filter(isNotEmptyString).join(', ')}
            onPress={onPress}
            testID={PassiveIncomeSelector.Payout(transaction.id)}
        />
    );
};
