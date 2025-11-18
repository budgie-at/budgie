import { InstrumentTypeEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { cn } from '../../utils/cn.util';
import { Card } from '../card/card';
import { CurrencySelectorBottomSheet } from '../currency-selector-bottom-sheet/currency-selector-bottom-sheet';
import { Icon } from '../icon/icon';

interface Props {
    readonly className?: string;
    readonly instrumentId?: number;
    readonly onChange: (instrumentId: number) => void;
}

export const CurrencySelector = ({ instrumentId, onChange, className }: Props) => {
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.FIAT);
    const ref = useRef<BottomSheetInterface>(null);

    const selectedCurrency = instruments.find(({ id }) => id === instrumentId);

    const handleOpen = () => void ref.current?.open();

    if (!isDefined(selectedCurrency)) {
        return null;
    }

    return (
        <>
            <Card
                className={cn('rounded-3xl border border-secondary-corner p-3xl flex-row gap-x-xl items-center', className)}
                onPress={handleOpen}
            >
                <View className="rounded-5xl bg-secondary-background p-lg w-[48px] h-[48px] items-center justify-center">
                    <Text className="text-primary text-4xl">{selectedCurrency.symbol}</Text>
                </View>

                <View className="gap-y-xs flex-1">
                    <Text className="text-primary font-medium text-sm">
                        {selectedCurrency.name}
                        <Text> {selectedCurrency.code}</Text>
                    </Text>
                    <Text className="text-sm text-secondary-foreground">
                        <Trans>Base currency</Trans>
                    </Text>
                </View>

                <Icon icon={ICONS.Sparkles} className="text-secondary-foreground/50" size={16} />
            </Card>

            <CurrencySelectorBottomSheet selectedInstrumentId={instrumentId} onSelect={onChange} ref={ref} />
        </>
    );
};
