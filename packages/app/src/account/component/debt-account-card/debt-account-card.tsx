import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { DEBT_REMAINING_LABEL } from '../../constant/debt-remaining-label.constant';
import { DEBT_SETTLED_LABEL } from '../../constant/debt-settled-label.constant';
import { DebtAccountCardDeadline } from '../debt-account-card-deadline/debt-account-card-deadline';
import { DebtAccountCardEmpty } from '../debt-account-card-empty/debt-account-card-empty';
import { DebtAccountCardFrame } from '../debt-account-card-frame/debt-account-card-frame';
import { DebtAccountCardProgress } from '../debt-account-card-progress/debt-account-card-progress';
import { DebtAccountCardSettled } from '../debt-account-card-settled/debt-account-card-settled';
import { DebtAccountCardSkeleton } from '../debt-account-card-skeleton/debt-account-card-skeleton';
import { DebtAccountCardSummary } from '../debt-account-card-summary/debt-account-card-summary';

import type { AccountEntityInterface, DebtAccountProgressSummaryInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'title' | 'debtType' | 'deadline'>;
    readonly instrumentSymbol: string;
    readonly debtProgressSummary: DebtAccountProgressSummaryInterface | null;
    readonly className?: string;
}

export const DebtAccountCard = ({ account, instrumentSymbol, debtProgressSummary, className }: Props) => {
    const { id, title, debtType, deadline } = account;

    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();

    const deadlineBadge = isDefined(deadline) ? <DebtAccountCardDeadline deadline={deadline} /> : null;

    if (!isDefined(debtProgressSummary)) {
        return (
            <DebtAccountCardFrame
                id={id}
                title={title}
                accessibilityLabel={`${title}. ${t`Loading debt progress`}`}
                subtitle={deadlineBadge}
                trailing={<DebtAccountCardSkeleton />}
                className={className}
            />
        );
    }

    const { outstandingAmount, paidAmount, percentage, totalAmount } = debtProgressSummary;
    const displayPercentage = percentage >= 100 ? 100 : Math.floor(percentage);
    const isSettled = !isPositiveNumber(outstandingAmount) && percentage >= 100;
    const subtitle = isSettled ? <DebtAccountCardSettled debtType={debtType} /> : deadlineBadge;
    const trailing = isPositiveNumber(totalAmount) ? (
        <DebtAccountCardSummary
            instrumentSymbol={instrumentSymbol}
            outstandingAmount={outstandingAmount}
            title={title}
            totalAmount={totalAmount}
        />
    ) : (
        <DebtAccountCardEmpty />
    );

    return (
        <DebtAccountCardFrame
            id={id}
            title={title}
            accessibilityLabel={`${title}. ${t(DEBT_REMAINING_LABEL[debtType])}: ${protectAmount(outstandingAmount, instrumentSymbol)}. ${t(DEBT_SETTLED_LABEL[debtType])}: ${protectAmount(paidAmount, instrumentSymbol)}. ${t`Total`}: ${protectAmount(totalAmount, instrumentSymbol)}. ${displayPercentage}%`}
            subtitle={subtitle}
            trailing={trailing}
            className={className}
        >
            <DebtAccountCardProgress debtType={debtType} percentage={displayPercentage} title={title} />
        </DebtAccountCardFrame>
    );
};
