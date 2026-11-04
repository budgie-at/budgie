import { View } from 'react-native';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { isInzhurFundAccount } from '../../utils/is-inzhur-fund-account.util';
import { InzhurFundReturnsCard } from '../inzhur-fund-returns-card/inzhur-fund-returns-card';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'instrumentId' | 'type' | 'externalSource'>;
}

export const InzhurFundReturns = ({ account }: Props) => {
    if (!isInzhurFundAccount(account)) {
        return null;
    }

    return (
        <View className="self-stretch">
            <CollapsibleChromeScrollFade>
                <InzhurFundReturnsCard account={account} />
            </CollapsibleChromeScrollFade>
        </View>
    );
};
