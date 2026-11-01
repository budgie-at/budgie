import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { Ticker } from '../../../@generic/component/ticker/ticker';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { getTextStyleForTicket } from '../../../@generic/utils/get-text-style-for-ticket.util';
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

    if (isCryptoAccountType(account.type) && isAmountProtected) {
        return (
            <Text
                numberOfLines={1}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="w-full text-center font-semibold text-secondary-foreground"
                style={getTextStyleForTicket(ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT)}
            >
                {PROTECTED_HERO_PLACEHOLDER}
            </Text>
        );
    }

    if (isCryptoAccountType(account.type)) {
        return (
            <Ticker
                hasAnimation
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
