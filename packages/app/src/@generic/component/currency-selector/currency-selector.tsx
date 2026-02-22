import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetRatesByBaseAndQuoteIdsQuery } from '../../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCurrencySelectorModal } from '../../context/currency-selector-modal.context';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props {
    readonly instrumentId?: number;
    readonly onChange: (instrumentId: number) => void;
}

export const CurrencySelector = ({ instrumentId, onChange }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.FIAT);
    const { rate } = useGetRatesByBaseAndQuoteIdsQuery(instrumentId ?? 0, defaultInstrument.id);
    const [openCurrencySelector] = useCurrencySelectorModal();

    const selectedCurrency = instruments.find(({ id }) => id === instrumentId);

    if (!isDefined(selectedCurrency)) {
        return null;
    }

    const { code: selectedCurrencyCode, name, symbol } = selectedCurrency;
    const { code: defaultInstrumentCode } = defaultInstrument;

    const convertedAmount = isDefined(rate) ? rate.rate : 1;
    const isBaseCurrency = !isDefined(rate);

    const handleOpen = async () => {
        const result = await openCurrencySelector({ selectedInstrumentId: instrumentId });
        if (isDefined(result)) {
            onChange(result);
        }
    };

    return (
        <HorizontalCell
            left={
                <View className="rounded-5xl bg-secondary-background w-12 h-12 items-center justify-center">
                    <Text className="text-primary text-4xl">{symbol}</Text>
                </View>
            }
            right={<Icon icon={UserIconNameEnum.Sparkles} className="text-secondary-foreground/50" size={16} />}
            onPress={handleOpen}
            size="lg"
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
