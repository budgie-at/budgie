import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCurrencySelectorModal } from '../../context/currency-selector-modal.context';
import { formatExchangeRate } from '../../utils/format-exchange-rate.util';
import { CurrencySelectorInstrumentIcon } from '../currency-selector-instrument-icon/currency-selector-instrument-icon';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props {
    readonly instrumentId?: number;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly testID?: string;
    readonly onChange: (instrumentId: number) => void;
}

export const CurrencySelector = ({ instrumentId, instrumentType = InstrumentTypeEnum.FIAT, onChange, testID }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(instrumentId ?? 0, defaultInstrument.id);
    const [openCurrencySelector] = useCurrencySelectorModal();

    const selectedCurrency = instruments.find(({ id }) => id === instrumentId);

    if (!isDefined(selectedCurrency)) {
        return null;
    }

    const { code: selectedCurrencyCode, name, symbol } = selectedCurrency;
    const { code: defaultInstrumentCode } = defaultInstrument;

    const convertedAmount = isDefined(rate) ? formatExchangeRate(rate.rate) : '1';
    const isBaseCurrency = !isDefined(rate);
    const left = <CurrencySelectorInstrumentIcon code={selectedCurrencyCode} symbol={symbol} type={instrumentType} isLargeFiatSymbol />;

    const handleOpen = async () => {
        const result = await openCurrencySelector({ selectedInstrumentId: instrumentId, instrumentType });
        if (isDefined(result)) {
            onChange(result);
        }
    };

    return (
        <HorizontalCell
            left={left}
            right={<Icon icon={UserIconNameEnum.Sparkles} className="text-secondary-foreground/50" size={16} />}
            onPress={handleOpen}
            size="lg"
            testID={testID}
        >
            <View className="gap-y-xs flex-1">
                <Text className="text-primary font-medium text-sm">
                    {name} <Text className="text-primary">{selectedCurrencyCode}</Text>
                </Text>

                <Text className="text-sm text-secondary-foreground">
                    {isBaseCurrency ? (
                        <Trans>Base currency</Trans>
                    ) : (
                        <Trans>
                            1 {selectedCurrencyCode} ~ {convertedAmount} {defaultInstrumentCode}
                        </Trans>
                    )}
                </Text>
            </View>
        </HorizontalCell>
    );
};
