import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { AccountDetailsMonthChips } from '../account-details-month-chips/account-details-month-chips';
import { AccountDetailsStatusLine } from '../account-details-status-line/account-details-status-line';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'iban' | AccountAssociationEnum.INSTRUMENT>;
    readonly balance: number;
}

export const AccountDetailsHero = ({ account, balance }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();

    const formattedBalance = protectAmount(balance, account.instrument.symbol);

    return (
        <View className="items-center gap-y-lg pb-md">
            <CollapsibleChromeScrollFade>
                <View
                    accessible
                    accessibilityLabel={t`Balance: ${formattedBalance}`}
                    testID={AccountDetailsSelector.Balance}
                    collapsable={false}
                    className="w-full"
                >
                    <ProtectedMoney
                        className="font-semibold tracking-[-1px]"
                        minFontSize={24}
                        maxFontSize={48}
                        instrumentSymbol={account.instrument.symbol}
                    >
                        {balance}
                    </ProtectedMoney>
                </View>
            </CollapsibleChromeScrollFade>

            <AccountDetailsStatusLine account={account} />

            <AccountDetailsMonthChips accountId={account.id} />
        </View>
    );
};
