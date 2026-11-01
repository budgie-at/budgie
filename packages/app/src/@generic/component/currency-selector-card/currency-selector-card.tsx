import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CurrencySelectorInstrumentIcon } from '../currency-selector-instrument-icon/currency-selector-instrument-icon';
import { SelectorRow } from '../selector-row/selector-row';

interface Props extends Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name' | 'type'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
}

export const CurrencySelectorCard = ({ isSelected, name, onSelect, code, symbol, id, type }: Props) => {
    const { t } = useLingui();
    const handleSelect = () => void onSelect(id);
    const isFiatWithSymbol = type === InstrumentTypeEnum.FIAT && symbol !== code;
    const codeLabel = name.toUpperCase() === code.toUpperCase() ? null : code;
    const subtitle = isFiatWithSymbol ? t`${code} · ${symbol}` : codeLabel;

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handleSelect}
            testID={CreateAccountScreenSelector.CurrencyOption(code)}
            left={<CurrencySelectorInstrumentIcon code={code} symbol={symbol} type={type} size={36} />}
            title={name}
            subtitle={subtitle}
        />
    );
};
