import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { InzhurFundReturnsCard } from '../inzhur-fund-returns-card/inzhur-fund-returns-card';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title' | 'instrumentId' | 'type' | 'externalSource'>;
}

export const InzhurFundReturns = ({ account }: Props) => {
    if (account.type !== AccountTypeEnum.STOCKS || account.externalSource !== ExternalSourceEnum.INZHUR) {
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
