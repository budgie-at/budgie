import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCurrencySelectorModal } from '../../context/currency-selector-modal.context';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { formatExchangeRate } from '../../utils/format-exchange-rate.util';
import { AccountCurrencyIcon } from '../account-currency-icon/account-currency-icon';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';

interface Props {
    readonly value: number;
    readonly onChange: (instrumentId: number) => void;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly variant?: ColorPaletteVariant;
    readonly note?: string;
}

export const CreateAccountCurrencyField = ({
    value,
    onChange,
    instrumentType = InstrumentTypeEnum.FIAT,
    variant = 'secondary',
    note
}: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(value, defaultInstrument.id);
    const [openCurrencySelector] = useCurrencySelectorModal();

    const handleOpen = () => {
        openCurrencySelector({ selectedInstrumentId: value, instrumentType }, selectedInstrument => {
            if (isDefined(selectedInstrument)) {
                onChange(selectedInstrument);
            }
        });
    };

    const selectedCurrency = instruments.find(({ id }) => id === value);

    if (!isDefined(selectedCurrency)) {
        return null;
    }

    const { code, name, symbol } = selectedCurrency;
    const defaultCode = defaultInstrument.code;
    const convertedAmount = isDefined(rate) ? formatExchangeRate(rate.rate) : '1';
    const rateSubtitle = isDefined(rate) ? t`${code} · 1 ${code} ≈ ${convertedAmount} ${defaultCode}` : t`${code} · Base currency`;
    const subtitle = isDefined(note) ? `${code} · ${note}` : rateSubtitle;

    return (
        <GroupedListRow
            left={<AccountCurrencyIcon code={code} symbol={symbol} instrumentType={instrumentType} variant={variant} />}
            title={name}
            subtitle={subtitle}
            titleTestID={CreateAccountScreenSelector.SelectedCurrency(code)}
            testID={CreateAccountScreenSelector.CurrencySelector}
            onPress={handleOpen}
        />
    );
};
