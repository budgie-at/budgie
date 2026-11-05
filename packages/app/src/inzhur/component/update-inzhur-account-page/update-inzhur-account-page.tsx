import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { UpdateAccountPage } from '../../../account/component/update-account-page/update-account-page';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
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
    const formatDigits = useDisplayFormatDigits();
    const isCash = isInzhurCashAccount(account);
    const actualBalance = fields.currentBalance.field.value;
    const differenceLabel = formatDigits(Math.abs(actualBalance - balance), instrumentSymbol);
    const isDifferent = isCash && formatDigits(actualBalance) !== formatDigits(balance);
    const outcomeCaption =
        actualBalance > balance
            ? t`+${differenceLabel} will be recorded as dividends kept in Inzhur`
            : t`−${differenceLabel} will be recorded as an adjustment`;
    const holdingsRow = isCash ? null : <InzhurFundHoldingsSection balance={balance} />;
    const footerCaption = isDifferent ? outcomeCaption : null;

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
            details={holdingsRow}
            footerCaption={footerCaption}
            hero={hero}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
        >
            {isCash ? null : (
                <InzhurDividendPayoutField value={fields.dividendPayout.field.value} onChange={fields.dividendPayout.field.onChange} />
            )}
        </UpdateAccountPage>
    );
};
