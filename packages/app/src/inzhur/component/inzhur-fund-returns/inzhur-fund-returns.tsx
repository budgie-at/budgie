import { View } from 'react-native';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { InzhurFundChart } from '../inzhur-fund-chart/inzhur-fund-chart';
import { InzhurFundGainLine } from '../inzhur-fund-gain-line/inzhur-fund-gain-line';
import { InzhurFundHoldingLine } from '../inzhur-fund-holding-line/inzhur-fund-holding-line';
import { InzhurFundReturnsCard } from '../inzhur-fund-returns-card/inzhur-fund-returns-card';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
    readonly balance: number;
}

export const InzhurFundReturns = ({ account, balance }: Props) => (
    <View className="gap-y-3xl self-stretch">
        <CollapsibleChromeScrollFade>
            <View className="gap-y-xs">
                <InzhurFundGainLine fundAccountId={account.id} />
                <InzhurFundHoldingLine account={account} balance={balance} />
            </View>
        </CollapsibleChromeScrollFade>
        <InzhurFundChart fundAccountId={account.id} />
        <CollapsibleChromeScrollFade>
            <InzhurFundReturnsCard account={account} />
        </CollapsibleChromeScrollFade>
    </View>
);
