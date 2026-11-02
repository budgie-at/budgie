import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CurrencySelectorInstrumentIcon } from '../currency-selector-instrument-icon/currency-selector-instrument-icon';
import { SelectorRowSubtitle } from '../selector-row-subtitle/selector-row-subtitle';
import { SelectorRowTitle } from '../selector-row-title/selector-row-title';
import { SelectorRow } from '../selector-row/selector-row';

interface Props extends Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name' | 'type'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly highlight: string;
}

export const CurrencySelectorCard = ({ isSelected, name, onSelect, code, symbol, id, type, highlight }: Props) => {
    const { t } = useLingui();
    const handleSelect = () => void onSelect(id);
    const isFiatWithSymbol = type === InstrumentTypeEnum.FIAT && symbol !== code;
    const codeLabel = name.toUpperCase() === code.toUpperCase() ? null : code;
    const subtitleText = isFiatWithSymbol ? t`${code} · ${symbol}` : codeLabel;
    const subtitle = isDefined(subtitleText) ? <SelectorRowSubtitle text={subtitleText} highlight={highlight} /> : null;

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handleSelect}
            testID={CreateAccountScreenSelector.CurrencyOption(code)}
            left={<CurrencySelectorInstrumentIcon code={code} symbol={symbol} type={type} size={36} />}
            title={<SelectorRowTitle text={name} highlight={highlight} isSelected={isSelected} />}
            subtitle={subtitle}
        />
    );
};
