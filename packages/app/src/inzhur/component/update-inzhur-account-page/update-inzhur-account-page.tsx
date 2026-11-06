import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { UpdateAccountPage } from '../../../account/component/update-account-page/update-account-page';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { isInzhurCashAccount } from '../../utils/is-inzhur-cash-account.util';
import { InzhurCashReconciliation } from '../inzhur-cash-reconciliation/inzhur-cash-reconciliation';

import type { AccountFormBindingsInterface } from '../../../account/interface/account-form-bindings.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountEntityInterface;
    readonly balance: number;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'currentBalance' | 'isActive' | 'includeInNetWorth'>;
    readonly instrumentSymbol: string;
    readonly isSubmitting: boolean;
    readonly onSubmit: EmptyFn;
}

export const UpdateInzhurAccountPage = ({ account, balance, fields, instrumentSymbol, isSubmitting, onSubmit }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const formatFundQuantity = useFormatFundQuantity();
    const isCash = isInzhurCashAccount(account);
    const actualBalance = fields.currentBalance.field.value;
    const differenceLabel = formatDigits(Math.abs(actualBalance - balance), instrumentSymbol);
    const isDifferent = isCash && formatDigits(actualBalance) !== formatDigits(balance);
    const outcomeCaption =
        actualBalance > balance
            ? t`+${differenceLabel} will be recorded as dividends kept in Inzhur`
            : t`−${differenceLabel} will be recorded as an adjustment`;
    const quantityLabel = formatFundQuantity(balance);
    const holdingsFootnote = isCash ? null : t`${quantityLabel} · updated from imports`;
    const footerCaption = isDifferent ? outcomeCaption : null;

    const hero = isCash ? (
        <InzhurCashReconciliation
            value={fields.currentBalance.field.value}
            onChange={fields.currentBalance.field.onChange}
            instrumentSymbol={instrumentSymbol}
        />
    ) : null;

    return (
        <UpdateAccountPage
            account={account}
            fields={fields}
            detailsFooter={holdingsFootnote}
            footerCaption={footerCaption}
            hero={hero}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
        />
    );
};
