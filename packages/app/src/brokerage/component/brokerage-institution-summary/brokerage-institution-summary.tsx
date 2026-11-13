import { View } from 'react-native';

import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../../account/constant/account-details-hero-balance-height.constant';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { useBrokerageSummaryQuery } from '../../query/use-brokerage-summary.query';
import { BrokerageAddPositionAction } from '../brokerage-add-position-action/brokerage-add-position-action';
import { BrokerageGainLine } from '../brokerage-gain-line/brokerage-gain-line';
import { BrokerageHoldings } from '../brokerage-holdings/brokerage-holdings';

import type { HomeAccountBalanceInterface } from '../../../account/interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../../account/interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'accounts' | 'label'>;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const BrokerageInstitutionSummary = ({ institution, balancesByAccountId }: Props) => {
    const { gain, percent, holdings, hasSecurities, isLoading, isPartial, instrumentSymbol } = useBrokerageSummaryQuery(
        institution.accounts,
        balancesByAccountId
    );

    const balanceSlotStyle = { height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT };

    return (
        <View className="gap-y-4xl">
            <View className="items-center gap-y-lg pb-md" testID={InstitutionSelector.Hero}>
                <View style={balanceSlotStyle} />
                {hasSecurities ? (
                    <BrokerageGainLine
                        gain={gain}
                        percent={percent}
                        instrumentSymbol={instrumentSymbol}
                        isLoading={isLoading}
                        isPartial={isPartial}
                    />
                ) : null}
            </View>
            <BrokerageAddPositionAction />
            <BrokerageHoldings
                holdings={holdings}
                bankName={institution.label}
                instrumentSymbol={instrumentSymbol}
                balancesByAccountId={balancesByAccountId}
            />
        </View>
    );
};
