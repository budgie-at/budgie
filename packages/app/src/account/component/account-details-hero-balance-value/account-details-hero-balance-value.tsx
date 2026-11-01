import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { Ticker } from '../../../@generic/component/ticker/ticker';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { useAccountDetailsBalanceLabel } from '../../hook/use-account-details-balance-label.hook';
import { isCryptoAccountType } from '../../utils/is-crypto-account-type.util';

interface Props {
    readonly balance: number;
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'type' | AccountAssociationEnum.INSTRUMENT>;
}

export const AccountDetailsHeroBalanceValue = ({ balance, account }: Props) => {
    const getBalanceLabel = useAccountDetailsBalanceLabel();
    const isAmountProtected = useIsAmountProtected();

    if (isCryptoAccountType(account.type)) {
        return (
            <Ticker
                hasAnimation={!isAmountProtected}
                number={getBalanceLabel(balance, account)}
                textClassName="font-semibold tracking-[-1px] text-primary"
                minFontSize={24}
                maxFontSize={ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT}
            />
        );
    }

    return (
        <ProtectedMoney
            className="font-semibold tracking-[-1px]"
            minFontSize={24}
            maxFontSize={ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT}
            instrumentSymbol={account.instrument.symbol}
        >
            {balance}
        </ProtectedMoney>
    );
};
