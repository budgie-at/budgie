import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';
import { useInstrumentPositionsQuery } from '../../market-data/query/use-instrument-positions.query';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { calculatePortfolioReturn } from '../utils/calculate-portfolio-return.util';

import { brokerageCashReturnAtom } from './brokerage-cash-return.atom';

import type { HomeAccountBalanceInterface } from '../../account/interface/home-account-balance.interface';
import type { BrokerageHoldingInterface } from '../interface/brokerage-holding.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

const zeroBrokerageCashReturnAtom = Atom.make(AsyncResult.success(0));

export const useBrokerageSummaryQuery = (
    accounts: readonly AccountWithSyncEntityInterface[],
    balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>
) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const securities = accounts.filter(account => isListedSecurityType(account.instrument.type));
    const cashAccounts = accounts.filter(account => account.instrument.type === InstrumentTypeEnum.FIAT);
    const instrumentIds = [...new Set(securities.map(account => account.instrumentId))].sort((left, right) => left - right);
    const cashAccountIds = [...new Set(cashAccounts.map(account => account.id))].sort((left, right) => left - right);
    const positions = useInstrumentPositionsQuery(
        instrumentIds,
        defaultInstrument.id,
        securities.map(account => account.id)
    );
    const positionByInstrumentId = new Map(
        instrumentIds.map((instrumentId, index) => [instrumentId, positions.at(index) ?? null] as const)
    );
    const cashReturn = AsyncResult.getOrElse(
        useLiveAtomValue(
            isNotEmptyArray(cashAccountIds) ? brokerageCashReturnAtom([cashAccountIds, defaultInstrument.id]) : zeroBrokerageCashReturnAtom
        ),
        () => 0
    );

    const getValue = (account: Pick<AccountWithSyncEntityInterface, 'id'>) => balancesByAccountId.get(account.id)?.convertedBalance ?? 0;
    const cash = cashAccounts.reduce((total, account) => total + getValue(account), 0);
    const { gain, percent, positionReturns } = calculatePortfolioReturn(
        securities.map(account => ({
            value: getValue(account),
            balance: balancesByAccountId.get(account.id)?.balance ?? 0,
            isValued: balancesByAccountId.get(account.id)?.isValued === true,
            position: positionByInstrumentId.get(account.instrumentId) ?? null
        })),
        cash,
        cashReturn
    );
    const positiveTotal = [...securities, ...cashAccounts].reduce((total, account) => total + Math.max(getValue(account), 0), 0);
    const cashLabel = t({ message: 'Cash', context: 'Brokerage cash account' });

    const holdings: BrokerageHoldingInterface[] = [...securities, ...cashAccounts.filter(account => getValue(account) !== 0)]
        .map((account, index) => {
            const holdingValue = getValue(account);
            const isValued = balancesByAccountId.get(account.id)?.isValued === true;
            const holdingReturn = positionReturns.at(index) ?? null;
            const holdingGain = holdingReturn?.gain ?? null;
            const costBasis = holdingReturn?.costBasis ?? null;

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
        percent,
        holdings,
        hasSecurities: isNotEmptyArray(securities),
        isLoading: isNotEmptyArray(securities) && !isNotEmptyArray(positions),
        isPartial: securities.some(account => balancesByAccountId.get(account.id)?.isValued !== true),
        instrumentSymbol: defaultInstrument.symbol
    };
};
