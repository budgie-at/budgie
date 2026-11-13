import { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { MOTION_FADE_IN, MOTION_FADE_OUT, MOTION_LAYOUT } from '../../../@generic/constant/motion.constant';
import { SecurityPositionGainLine } from '../../../brokerage/component/security-position-gain-line/security-position-gain-line';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { InzhurFundReturns } from '../../../inzhur/component/inzhur-fund-returns/inzhur-fund-returns';
import { isInzhurFundAccount } from '../../../inzhur/utils/is-inzhur-fund-account.util';
import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { isCryptoAccountType } from '../../utils/is-crypto-account-type.util';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountDetailsAutomaticNotice } from '../account-details-automatic-notice/account-details-automatic-notice';
import { AccountDetailsConvertedValue } from '../account-details-converted-value/account-details-converted-value';
import { AccountDetailsHiddenPill } from '../account-details-hidden-pill/account-details-hidden-pill';
import { AccountDetailsMarketLink } from '../account-details-market-link/account-details-market-link';
import { AccountDetailsMonthChips } from '../account-details-month-chips/account-details-month-chips';
import { AccountDetailsStatusLine } from '../account-details-status-line/account-details-status-line';

interface Props {
    readonly account: Pick<
        AccountWithInstrumentEntityInterface,
        'id' | 'iban' | 'isActive' | 'externalId' | 'title' | 'type' | 'instrumentId' | 'externalSource' | AccountAssociationEnum.INSTRUMENT
    >;
    readonly balance: number;
}

const BALANCE_SLOT_STYLE = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };

export const AccountDetailsHero = ({ account, balance }: Props) => {
    const isAutomatic = isUntrackedOwnAccount(account);

    return (
        <View className="items-center gap-y-lg pb-md">
            <View style={BALANCE_SLOT_STYLE} />

            {isCryptoAccountType(account.type) || isListedSecurityType(account.instrument.type) ? (
                <>
                    <CollapsibleChromeScrollFade>
                        <AccountDetailsConvertedValue balance={balance} instrument={account.instrument} />
                    </CollapsibleChromeScrollFade>

                    <AccountDetailsMarketLink instrument={account.instrument} />
                </>
            ) : null}

            {isInzhurFundAccount(account) ? (
                <InzhurFundReturns account={account} balance={balance} />
            ) : (
                <AccountDetailsStatusLine account={account} />
            )}

            {isAutomatic ? <AccountDetailsAutomaticNotice /> : null}

            {account.isActive || isAutomatic ? null : (
                <Animated.View entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT}>
                    <AccountDetailsHiddenPill account={account} />
                </Animated.View>
            )}

            {isListedSecurityType(account.instrument.type) ? <SecurityPositionGainLine account={account} balance={balance} /> : null}

            {isInzhurFundAccount(account) || isListedSecurityType(account.instrument.type) ? null : (
                <Animated.View layout={MOTION_LAYOUT}>
                    <AccountDetailsMonthChips accountId={account.id} />
                </Animated.View>
            )}
        </View>
    );
};
