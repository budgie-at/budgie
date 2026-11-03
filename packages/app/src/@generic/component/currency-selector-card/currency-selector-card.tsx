import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CurrencySelectorInstrumentIcon } from '../currency-selector-instrument-icon/currency-selector-instrument-icon';
import { SelectorRowTitle } from '../selector-row-title/selector-row-title';
import { SelectorRow } from '../selector-row/selector-row';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name' | 'type'>;
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly highlight: string;
}

export const CurrencySelectorCard = ({ instrument, isSelected, onSelect, highlight }: Props) => {
    const { name, code, symbol, id, type } = instrument;
    const handleSelect = () => void onSelect(id);
    const isFiatWithSymbol = type === InstrumentTypeEnum.FIAT && symbol !== code;
    const codeLabel = name.toUpperCase() === code.toUpperCase() ? null : code;
    const subtitleText = isFiatWithSymbol ? `${code} · ${symbol}` : codeLabel;
    const subtitle = isDefined(subtitleText) ? (
        <SelectorRowTitle text={subtitleText} highlight={highlight} className="text-secondary-foreground text-[13px] leading-[18px]" />
    ) : null;

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
