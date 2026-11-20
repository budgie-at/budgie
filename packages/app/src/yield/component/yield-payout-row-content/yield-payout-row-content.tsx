import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { getTransactionHref } from '../../../transaction/utils/get-transaction-href.util';
import { YIELD_SOURCE_FOCUS } from '../../constant/yield-source-focus.constant';
import { useYieldPayoutRowText } from '../../hook/use-yield-payout-row-text.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldPayoutIcon } from '../yield-payout-icon/yield-payout-icon';
import { YieldPayoutTrailing } from '../yield-payout-trailing/yield-payout-trailing';
import { YieldRowChevron } from '../yield-row-chevron/yield-row-chevron';
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

    const sourceAccountId = transaction.yieldSourceAccountId;
    const hasChevron = !isMerged || isDefined(sourceAccountId);

    const handlePress = () => {
        if (isMerged) {
            if (isDefined(sourceAccountId)) {
                router.setParams({ position: String(sourceAccountId), instrument: '', group: '' });
            }

            return;
        }

        if (isUnassigned && transaction.type === TransactionTypeEnum.INCOME) {
            router.push({ pathname: '/transactions/[id]/income', params: { id: String(transaction.id), focus: YIELD_SOURCE_FOCUS } });

            return;
        }

        router.push(getTransactionHref(transaction));
    };

    const rowClassName = cn(isMerged && 'min-h-[64px]', className);
    const amountClassName = cn(AMOUNT_CLASSNAME, isTax ? TAX_CLASSNAME : INCOME_CLASSNAME);

    const trailing = (
        <View className="flex-row items-center gap-x-sm">
            <YieldPayoutTrailing amount={trailingText} amountClassName={amountClassName} taxText={taxText} />
            {hasChevron ? <YieldRowChevron /> : null}
        </View>
    );

    return (
        <YieldRow
            left={<YieldPayoutIcon kind={kind} cryptoCode={cryptoCode} />}
            title={title}
            className={rowClassName}
            subtitle={<YieldRowSubtitle subtitle={subtitle} />}
            trailing={trailing}
            accessibilityLabel={[title, subtitle, trailingText, taxText].filter(isNotEmptyString).join(', ')}
            onPress={handlePress}
            testID={PassiveIncomeSelector.Payout(transaction.id)}
        />
    );
};
