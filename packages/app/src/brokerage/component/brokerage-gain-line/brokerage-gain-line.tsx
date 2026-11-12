import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GainLine } from '../../../@generic/component/gain-line/gain-line';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { useInstrumentPositionsQuery } from '../../../market-data/query/use-instrument-positions.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { brokerageCashReturnAtom } from '../../query/brokerage-cash-return.atom';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { HomeAccountBalanceInterface } from '../../../account/interface/home-account-balance.interface';
import type { InstitutionGroupInterface } from '../../../account/interface/institution-group.interface';

interface Props {
    readonly institution: Pick<InstitutionGroupInterface, 'accounts'>;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const BrokerageGainLine = ({ institution, balancesByAccountId }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const securities = institution.accounts.filter(account => isListedSecurityType(account.instrument.type));
    const cashAccounts = institution.accounts.filter(account => account.instrument.type === InstrumentTypeEnum.FIAT);
    const positions = useInstrumentPositionsQuery(
        securities.map(account => account.instrumentId),
        defaultInstrument.id,
        securities.map(account => account.id)
    );

    const cashReturn = AsyncResult.getOrElse(
        useLiveAtomValue(brokerageCashReturnAtom([cashAccounts.map(account => account.id), defaultInstrument.id])),
        () => 0
    );
    const balances = securities.map(account => balancesByAccountId.get(account.id));

    if (!isNotEmptyArray(securities)) {
        return null;
    }

    const isReady = isNotEmptyArray(positions) && balances.every(balance => balance?.isValued === true);
    const [value, cash] = [securities, cashAccounts].map(accounts =>
        accounts.reduce((total, account) => total + (balancesByAccountId.get(account.id)?.convertedBalance ?? 0), 0)
    );
    const gain = positions.reduce((total, position) => total + position.realizedProfitLoss - (position.costBasis ?? 0), value + cashReturn);
    const moneyIn = value + cash - gain;
    const percent = isPositiveNumber(moneyIn) ? gain / moneyIn : null;

    return (
        <LoadingContent isLoading={!isReady} loadingIndicator={null}>
            <GainLine
                gain={gain}
                percent={percent}
                suffix={t`total return`}
                instrumentSymbol={defaultInstrument.symbol}
                testID={BrokerageSelector.GainLine}
            />
        </LoadingContent>
    );
};
