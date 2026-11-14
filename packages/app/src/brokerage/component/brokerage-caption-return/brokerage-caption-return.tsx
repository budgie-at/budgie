import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useBrokerageSummaryQuery } from '../../query/use-brokerage-summary.query';
import { BrokerageReturnText } from '../brokerage-return-text/brokerage-return-text';

import type { HomeAccountBalanceInterface } from '../../../account/interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly accounts: readonly AccountWithSyncEntityInterface[];
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const BrokerageCaptionReturn = ({ accounts, balancesByAccountId }: Props) => {
    const { percent, holdings, instrumentSymbol } = useBrokerageSummaryQuery(accounts, balancesByAccountId);

    if (!isDefined(percent) || !holdings.some(holding => isDefined(holding.gain))) {
        return null;
    }

    return (
        <Text>
            {' · '}
            <BrokerageReturnText
                gain={null}
                percent={percent}
                instrumentSymbol={instrumentSymbol}
                maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            />
        </Text>
    );
};
