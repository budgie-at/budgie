import { CRYPTO_ACCOUNT_TYPES, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Arr from 'effect/Array';
import * as Order from 'effect/Order';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { homeAccountRowsAtom } from '../../../account/query/use-home-page-data.query';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { CurrencyMarketAccountRow } from '../currency-market-account-row/currency-market-account-row';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>;
}

export const CurrencyMarketAccounts = ({ instrument }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const rows = AsyncResult.getOrElse(useLiveAtomValue(homeAccountRowsAtom(defaultInstrument.id)), () => []);
    const valuationRate = useCryptoValuationRateQuery(instrument.id, defaultInstrument.id);
    const formatMoney = useDisplayFormatDigits();

    const accountRows = Arr.sort(
        rows.filter(
            row => row.account.isActive && row.account.instrumentId === instrument.id && CRYPTO_ACCOUNT_TYPES.includes(row.account.type)
        ),
        Order.flip(Order.mapInput(Order.Number, (row: (typeof rows)[number]) => row.balance))
    );

    if (!isNotEmptyArray(accountRows)) {
        return null;
    }

    return (
        <GroupedListSection title={t`Held in`}>
            {accountRows.map(row => {
                const amount = convertFromMicroUnits(row.balance);
                const valueLabel = isDefined(valuationRate) ? formatMoney(amount * valuationRate, defaultInstrument.symbol) : null;

                return (
                    <CurrencyMarketAccountRow
                        key={row.account.id}
                        account={row.account}
                        sync={row.sync}
                        instrumentCode={instrument.code}
                        amount={amount}
                        valueLabel={valueLabel}
                        testID={CurrencyMarketPageSelector.Account(instrument.code, row.account.id)}
                    />
                );
            })}
        </GroupedListSection>
    );
};
