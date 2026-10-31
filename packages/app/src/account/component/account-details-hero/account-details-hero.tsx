import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { AccountDetailsMonthChips } from '../account-details-month-chips/account-details-month-chips';
import { AccountDetailsStatusLine } from '../account-details-status-line/account-details-status-line';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'iban'>;
}

const BALANCE_SLOT_STYLE = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };

export const AccountDetailsHero = ({ account }: Props) => (
    <View className="items-center gap-y-lg pb-md">
        <View style={BALANCE_SLOT_STYLE} />

        <AccountDetailsStatusLine account={account} />

        <AccountDetailsMonthChips accountId={account.id} />
    </View>
);
