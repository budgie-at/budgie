import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { InstitutionRowDetail } from '../../../account/component/institution-row-detail/institution-row-detail';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';
import { useBrokerageSummaryQuery } from '../../query/use-brokerage-summary.query';
import { BrokerageReturnText } from '../brokerage-return-text/brokerage-return-text';

import type { HomeAccountBalanceInterface } from '../../../account/interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

const CAPTION_HOLDINGS_COUNT = 3;

interface Props {
    readonly accounts: readonly AccountWithSyncEntityInterface[];
    readonly accountsCountLabel: string;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const BrokerageInstitutionRowDetail = ({ accounts, accountsCountLabel, balancesByAccountId }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const formatPercent = useFormatPercent();
    const { gain, percent, holdings, hasSecurities, isLoading, isPartial, instrumentSymbol } = useBrokerageSummaryQuery(
        accounts,
        balancesByAccountId
    );

    const composition = holdings
        .flatMap(holding => (isDefined(holding.weight) ? [{ label: holding.label, weight: holding.weight }] : []))
        .slice(0, CAPTION_HOLDINGS_COUNT)
        .map(holding => (isAmountProtected ? holding.label : `${holding.label} ${formatPercent(holding.weight)}`))
        .join(' · ');
    const caption = isNotEmptyString(composition) ? composition : accountsCountLabel;

    if (!hasSecurities) {
        return <InstitutionRowDetail accounts={accounts} accountsCountLabel={accountsCountLabel} />;
    }

    return (
        <>
            <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} numberOfLines={1}>
                {caption}
            </Text>
            <LoadingContent isLoading={isLoading} loadingIndicator={null}>
                {isPartial ? (
                    <Text
                        className="text-[13px] text-secondary-foreground"
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={1}
                    >
                        <Trans>Some prices unavailable</Trans>
                    </Text>
                ) : (
                    <BrokerageReturnText gain={gain} percent={percent} instrumentSymbol={instrumentSymbol} />
                )}
            </LoadingContent>
        </>
    );
};
