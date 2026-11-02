import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { AccountDetailsHiddenPill } from '../account-details-hidden-pill/account-details-hidden-pill';
import { AccountDetailsMonthChips } from '../account-details-month-chips/account-details-month-chips';
import { AccountDetailsStatusLine } from '../account-details-status-line/account-details-status-line';

interface Props {
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'id' | 'iban' | 'isActive' | 'title'>;
}

const BALANCE_SLOT_STYLE = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };

export const AccountDetailsHero = ({ account }: Props) => (
    <View className="items-center gap-y-lg pb-md">
        <View style={BALANCE_SLOT_STYLE} />

        <AccountDetailsStatusLine account={account} />

        {account.isActive ? null : (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
                <AccountDetailsHiddenPill account={account} />
            </Animated.View>
        )}

        <Animated.View layout={LinearTransition}>
            <AccountDetailsMonthChips accountId={account.id} />
        </Animated.View>
    </View>
);
