import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useAccountSync } from '../../../sync/hook/use-account-sync.hook';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { AccountBalanceReadout } from '../account-balance-readout/account-balance-readout';
import { UpdateAccountPage } from '../update-account-page/update-account-page';

interface Props {
    readonly account: AccountEntityInterface;
    readonly instrumentSymbol: string;
    readonly allowNegativeBalance?: boolean;
    readonly balanceFieldLabel?: string;
    readonly children?: ReactNode;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'currentBalance' | 'isActive' | 'includeInNetWorth'>;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountScreen = (props: Props) => {
    const { children, account, onSubmit, fields, instrumentSymbol, allowNegativeBalance, balanceFieldLabel, isSubmitting } = props;
    const { t } = useLingui();
    const { sync } = useAccountSync(account.id);
    const { formatMonthAndDayWithTime } = useFormatDate();

    const showInstrumentAfterAmount = account.type === AccountTypeEnum.CRYPTO || account.type === AccountTypeEnum.CRYPTO_SYNC;
    const minimumDecimalPlaces = showInstrumentAfterAmount ? MICRO_UNIT_DECIMAL_PLACES : 0;
    const isSyncedAccount = account.type === AccountTypeEnum.BANK_SYNC || account.type === AccountTypeEnum.CRYPTO_SYNC;
    const providerTitle = isDefined(account.externalSource) ? BANK_PROVIDER_TITLE[account.externalSource] : null;
    const providerName = isDefined(providerTitle) ? t(providerTitle) : null;
    const readoutSource = isDefined(providerName) ? t`Balance from ${providerName}` : t`Balance from sync`;
    const readoutCaption = isDefined(sync?.forwardSyncedAt)
        ? `${readoutSource} · ${formatMonthAndDayWithTime(sync.forwardSyncedAt)}`
        : readoutSource;
    const hero = isSyncedAccount ? (
        <AccountBalanceReadout
            value={fields.currentBalance.field.value}
            caption={readoutCaption}
            instrumentSymbol={instrumentSymbol}
            minimumDecimalPlaces={minimumDecimalPlaces}
        />
    ) : (
        <AccountBalanceField
            instrumentSymbol={instrumentSymbol}
            value={fields.currentBalance.field.value}
            onChange={fields.currentBalance.field.onChange}
            label={balanceFieldLabel}
            allowNegative={allowNegativeBalance}
            minimumDecimalPlaces={minimumDecimalPlaces}
            showInstrumentAfterAmount={showInstrumentAfterAmount}
        />
    );

    return (
        <UpdateAccountPage account={account} fields={fields} onSubmit={onSubmit} isSubmitting={isSubmitting} hero={hero}>
            {children}
        </UpdateAccountPage>
    );
};
