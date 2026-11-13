import { useLingui } from '@lingui/react/macro';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { GROUPED_LIST_SUBTITLE_CLASSNAME } from '../../../@generic/constant/grouped-list-subtitle-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly balance: number;
    readonly instrument: Pick<InstrumentEntityInterface, 'code' | 'name' | 'symbol' | 'type'>;
}

export const SecurityHoldingRow = ({ balance, instrument }: Props) => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const held = formatInstrumentAmount(balance, instrument.symbol, instrument.type);

    return (
        <GroupedListSection>
            <GroupedListRow
                left={<CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={40} />}
                title={instrument.name}
                subtitle={
                    <ProtectedText
                        className={cn('text-secondary-foreground', GROUPED_LIST_SUBTITLE_CLASSNAME)}
                    >{t`${held} held`}</ProtectedText>
                }
                testID={BrokerageSelector.Holding}
            />
        </GroupedListSection>
    );
};
