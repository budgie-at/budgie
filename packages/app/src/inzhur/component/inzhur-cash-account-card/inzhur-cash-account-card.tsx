import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { AccountCardBalance } from '../../../account/component/account-card-balance/account-card-balance';
import { AccountCardBase } from '../../../account/component/account-card-base/account-card-base';

import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
}

export const InzhurCashAccountCard = ({ account, balance }: Props) => (
    <AccountCardBase account={account} balance={balance} convertedBalance={null}>
        <AccountCardBalance title={account.title} balance={balance} instrumentSymbol={account.instrument.symbol} />
        <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
            <Trans>Available to invest</Trans>
        </Text>
    </AccountCardBase>
);
