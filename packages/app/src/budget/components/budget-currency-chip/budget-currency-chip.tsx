import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';

interface Props {
    readonly instrumentId: number;
}

export const BudgetCurrencyChip = ({ instrumentId }: Props) => {
    const { t } = useLingui();
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    const label = isDefined(instrument) ? `${instrument.code} ${instrument.symbol}` : t`Unknown`;

    return (
        <FormItem label={t`Budget currency`}>
            <View className="self-start rounded-2xl border border-secondary-corner bg-secondary-background px-xl py-md">
                <Text className="text-primary-foreground text-md font-medium">{label}</Text>
            </View>
        </FormItem>
    );
};
