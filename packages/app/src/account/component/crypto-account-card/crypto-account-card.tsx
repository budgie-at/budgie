import { AccountWithSyncEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
}

export const CryptoAccountCard = ({ account, balance }: Props) => {
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const isAmountProtected = useIsAmountProtected();

    const formattedBalance = formatInstrumentAmount(balance, account.instrument.code, InstrumentTypeEnum.CRYPTO);
    const amountLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formattedBalance;
    const toneClassName = balance < 0 ? 'text-destructive-foreground' : 'text-primary';

    return (
        <AccountCardBase account={account} balance={balance} amountLabel={amountLabel}>
            <ProtectedText
                testID={AccountCardBaseSelector.Balance(account.title, formattedBalance)}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                className={cn('text-xl leading-[26px] font-semibold tracking-tight tabular-nums', toneClassName)}
            >
                {formattedBalance}
            </ProtectedText>
        </AccountCardBase>
    );
};
