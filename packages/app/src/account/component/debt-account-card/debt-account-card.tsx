import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { DEBT_CARD_FOOTER_VARIANT } from '../../constant/debt-card-footer-variant.constant';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { DebtAccountCardContext } from '../../context/debt-account-card.context';
import { DebtCardFooterVariantEnum } from '../../enum/debt-card-footer-variant.enum';
import { isDebtDeadlineUrgent } from '../../utils/is-debt-deadline-urgent.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { DebtAccountCardEmpty } from '../debt-account-card-empty/debt-account-card-empty';
import { DebtAccountCardFooter } from '../debt-account-card-footer/debt-account-card-footer';
import { DebtAccountCardPercentageFooter } from '../debt-account-card-percentage-footer/debt-account-card-percentage-footer';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

import type { AccountEntityInterface, DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props extends Pick<AccountEntityInterface, 'id' | 'createdAt' | 'title' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'> {
    readonly balance: number;
    readonly className?: string;
    readonly debtProgressSummary?: DebtAccountProgressSummaryInterface;
    readonly instrumentSymbol: string;
}

export const DebtAccountCard = (props: Props) => {
    const { id, createdAt, title, icon, balance, debtType, targetBalance, deadline, className, debtProgressSummary, instrumentSymbol } =
        props;

    const { t } = useLingui();
    const { formatCompactFullDate } = useFormatDate();
    const protectAmount = useProtectedAmountLabel();

    const summary: DebtAccountProgressSummaryInterface = debtProgressSummary ?? {
        closedAmount: 0,
        creditAmount: 0,
        debitAmount: 0,
        openedAmount: targetBalance,
        outstandingAmount: targetBalance,
        paidAmount: 0,
        percentage: 0,
        totalAmount: targetBalance
    };
    const isUrgent = isDefined(deadline) && isDebtDeadlineUrgent(createdAt, deadline);
    const displayPercentage = summary.percentage >= 100 ? 100 : Math.floor(summary.percentage);
    const contextValue = {
        debtType,
        displayPercentage,
        instrumentSymbol,
        settledLabel:
            !isPositiveNumber(summary.outstandingAmount) && displayPercentage === 100 ? t`Settled` : t(DEBT_SETTLED_LABEL[debtType]),
        summary,
        title
    };
    const hasDebt = isPositiveNumber(summary.totalAmount);
    const balanceContent = hasDebt ? <DebtAccountCardSummary /> : <DebtAccountCardEmpty />;
    const topRight = isDefined(deadline) ? (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Calendar} className="text-secondary-foreground" size={12} />
            <Text className="text-secondary-foreground text-xxs font-medium">{formatCompactFullDate(deadline)}</Text>
        </View>
    ) : null;

    return (
        <DebtAccountCardContext.Provider value={contextValue}>
            <AccountCardBase
                id={id}
                title={title}
                icon={icon}
                balance={balance}
                instrumentSymbol={instrumentSymbol}
                circleVariant={ACCOUNT_COLOR.DEBT}
                accessibilityLabel={`${title}. ${t(DEBT_REMAINING_LABEL[debtType])}: ${protectAmount(summary.outstandingAmount, instrumentSymbol)}. ${t(DEBT_SETTLED_LABEL[debtType])}: ${protectAmount(summary.paidAmount, instrumentSymbol)}. ${t`Total`}: ${protectAmount(summary.totalAmount, instrumentSymbol)}. ${displayPercentage}%`}
                balanceContent={balanceContent}
                topRight={topRight}
                className={cn(className, isUrgent && 'border-dark-warning-corner')}
            >
                {hasDebt &&
                    (DEBT_CARD_FOOTER_VARIANT === DebtCardFooterVariantEnum.STRIP ? (
                        <DebtAccountCardFooter />
                    ) : (
                        <DebtAccountCardPercentageFooter />
                    ))}
            </AccountCardBase>
        </DebtAccountCardContext.Provider>
    );
};
