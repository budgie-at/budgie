import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { UpdateAccountPage } from '../../../account/component/update-account-page/update-account-page';
import { isInzhurCashAccount } from '../../utils/is-inzhur-cash-account.util';
import { InzhurCashReconciliation } from '../inzhur-cash-reconciliation/inzhur-cash-reconciliation';
import { InzhurDividendPayoutField } from '../inzhur-dividend-payout-field/inzhur-dividend-payout-field';
import { InzhurFundHoldingsSection } from '../inzhur-fund-holdings-section/inzhur-fund-holdings-section';

import type { InzhurAccountFormBindingsInterface } from '../../interface/inzhur-account-form-bindings.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountEntityInterface;
    readonly balance: number;
    readonly fields: InzhurAccountFormBindingsInterface;
    readonly instrumentSymbol: string;
    readonly isSubmitting: boolean;
    readonly onSubmit: EmptyFn;
}

export const UpdateInzhurAccountPage = ({ account, balance, fields, instrumentSymbol, isSubmitting, onSubmit }: Props) => {
    const { t } = useLingui();
    const accountTitle = account.title;
    const isCash = isInzhurCashAccount(account);

    const hero = isCash ? (
        <InzhurCashReconciliation
            trackedBalance={balance}
            value={fields.currentBalance.field.value}
            onChange={fields.currentBalance.field.onChange}
            instrumentSymbol={instrumentSymbol}
        />
    ) : null;

    return (
        <UpdateAccountPage
            account={account}
            fields={fields}
            title={t`Edit ${accountTitle}`}
            detailsFooter=""
            hero={hero}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
        >
            {isCash ? null : (
                <>
                    <InzhurFundHoldingsSection balance={balance} />
                    <InzhurDividendPayoutField value={fields.dividendPayout.field.value} onChange={fields.dividendPayout.field.onChange} />
                </>
            )}
        </UpdateAccountPage>
    );
};
