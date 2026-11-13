import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';
import { useInstrumentPositionsQuery } from '../../market-data/query/use-instrument-positions.query';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import { brokerageCashReturnAtom } from './brokerage-cash-return.atom';

import type { HomeAccountBalanceInterface } from '../../account/interface/home-account-balance.interface';
import type { BrokerageHoldingInterface } from '../interface/brokerage-holding.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

export const useBrokerageSummaryQuery = (
    accounts: readonly AccountWithSyncEntityInterface[],
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const securities = accounts.filter(account => isListedSecurityType(account.instrument.type));
    const cashAccounts = accounts.filter(account => account.instrument.type === InstrumentTypeEnum.FIAT);
    const positions = useInstrumentPositionsQuery(
        securities.map(account => account.instrumentId),
        defaultInstrument.id,
        securities.map(account => account.id)
    );
    const cashReturn = AsyncResult.getOrElse(
        useLiveAtomValue(brokerageCashReturnAtom([cashAccounts.map(account => account.id), defaultInstrument.id])),
        () => 0
    );

    const getValue = (account: Pick<AccountWithSyncEntityInterface, 'id'>) => balancesByAccountId.get(account.id)?.convertedBalance ?? 0;
    const [value, cash] = [securities, cashAccounts].map(group => group.reduce((total, account) => total + getValue(account), 0));
    const securityGains = securities.map((account, index) => {
        const accountBalance = balancesByAccountId.get(account.id);
        const position = positions.at(index);
        const costBasis = position?.costBasis;

        if (
            accountBalance?.isValued !== true ||
            !isDefined(position) ||
            !isDefined(costBasis) ||
            !isPositiveNumber(accountBalance.balance)
        ) {
            return null;
        }

        return getValue(account) * Math.min(position.amount / accountBalance.balance, 1) - costBasis;
    });
    const gain = positions.reduce(
        (total, position, index) => total + position.realizedProfitLoss + (securityGains.at(index) ?? 0),
        cashReturn
    );
    const moneyIn = value + cash - gain;
    const positiveTotal = [...securities, ...cashAccounts].reduce((total, account) => total + Math.max(getValue(account), 0), 0);
    const cashLabel = t({ message: 'Cash', context: 'Brokerage cash account' });

    const holdings: BrokerageHoldingInterface[] = [...securities, ...cashAccounts.filter(account => getValue(account) !== 0)]
        .map((account, index) => {
            const holdingValue = getValue(account);
            const isValued = balancesByAccountId.get(account.id)?.isValued === true;
            const holdingGain = securityGains.at(index) ?? null;
            const costBasis = isDefined(holdingGain) ? (positions.at(index)?.costBasis ?? null) : null;

            return {
                account,
                label: index < securities.length ? account.instrument.symbol : cashLabel,
                value: holdingValue,
                isValued,
                weight: isPositiveNumber(holdingValue) && isPositiveNumber(positiveTotal) ? holdingValue / positiveTotal : null,
                gain: holdingGain,
                gainPercent: isDefined(holdingGain) && isPositiveNumber(costBasis) ? holdingGain / costBasis : null
            };
        })
        .sort((left, right) => right.value - left.value);

    return {
        gain,
        percent: isPositiveNumber(moneyIn) ? gain / moneyIn : null,
        holdings,
        hasSecurities: isNotEmptyArray(securities),
        isLoading: isNotEmptyArray(securities) && !isNotEmptyArray(positions),
        isPartial: securities.some(account => balancesByAccountId.get(account.id)?.isValued !== true),
        instrumentSymbol: defaultInstrument.symbol
    };
};
