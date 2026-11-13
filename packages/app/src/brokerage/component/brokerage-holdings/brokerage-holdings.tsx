import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { getChartSwatches } from '../../../@generic/utils/get-chart-swatches.util';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { StatisticsShareBar } from '../../../transaction/components/statistics-share-bar/statistics-share-bar';
import { getTransactionListRowPosition } from '../../../transaction/utils/get-transaction-list-row-position.util';
import { BrokerageHoldingRow } from '../brokerage-holding-row/brokerage-holding-row';

import type { HomeAccountBalanceInterface } from '../../../account/interface/home-account-balance.interface';
import type { BrokerageHoldingInterface } from '../../interface/brokerage-holding.interface';

interface Props {
    readonly holdings: readonly BrokerageHoldingInterface[];
    readonly bankName: string | null;
    readonly instrumentSymbol: string;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const BrokerageHoldings = ({ holdings, bankName, instrumentSymbol, balancesByAccountId }: Props) => {
    const { t } = useLingui();

    const holdingsCount = holdings.length;
    const swatches = getChartSwatches(holdings.map((_, index) => index));
    const segments = holdings.flatMap((holding, index) =>
        isDefined(holding.weight)
            ? [
                  {
                      key: String(holding.account.id),
                      label: holding.label,
                      amount: holding.value,
                      swatchClassName: swatches[index]?.fill ?? 'bg-secondary-foreground'
                  }
              ]
            : []
    );

    return (
        <View testID={InstitutionSelector.Accounts}>
            <SettingsGroup title={t`Holdings · ${holdingsCount}`}>
                {segments.length > 1 ? <StatisticsShareBar segments={segments} other={null} onOtherPress={emptyFn} /> : null}
                <View>
                    {holdings.map((holding, index) => (
                        <BrokerageHoldingRow
                            key={holding.account.id}
                            holding={holding}
                            balance={balancesByAccountId.get(holding.account.id)?.balance ?? 0}
                            bankName={bankName}
                            instrumentSymbol={instrumentSymbol}
                            position={getTransactionListRowPosition(index, holdingsCount)}
                        />
                    ))}
                </View>
            </SettingsGroup>
        </View>
    );
};
