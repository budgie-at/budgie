import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { isCryptoAccountType } from '../../utils/is-crypto-account-type.util';
import { AccountDetailsConvertedValue } from '../account-details-converted-value/account-details-converted-value';
import { AccountDetailsMarketLink } from '../account-details-market-link/account-details-market-link';
import { AccountDetailsMonthChips } from '../account-details-month-chips/account-details-month-chips';
import { AccountDetailsStatusLine } from '../account-details-status-line/account-details-status-line';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'iban' | 'type' | AccountAssociationEnum.INSTRUMENT>;
    readonly balance: number;
}

const BALANCE_SLOT_STYLE = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };

export const AccountDetailsHero = ({ account, balance }: Props) => (
    <View className="items-center gap-y-lg pb-md">
        <View style={BALANCE_SLOT_STYLE} />

        <AccountDetailsStatusLine account={account} />

        {isCryptoAccountType(account.type) ? (
            <>
                <CollapsibleChromeScrollFade>
                    <AccountDetailsConvertedValue balance={balance} instrumentId={account.instrument.id} />
                </CollapsibleChromeScrollFade>

                <AccountDetailsMarketLink instrument={account.instrument} />
            </>
        ) : null}

        <AccountDetailsMonthChips accountId={account.id} />
    </View>
);
