import { useLingui } from '@lingui/react/macro';
import { useController } from 'react-hook-form';
import { View } from 'react-native';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurAmountInput } from '../inzhur-amount-input/inzhur-amount-input';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';

export const InzhurPurchaseAmountField = () => {
    const { t } = useLingui();
    const { field } = useController<InzhurPurchaseFormValues, 'amount'>({ name: 'amount' });
    const hryvnia = useHryvniaInstrumentQuery();
    const instrumentSymbol = hryvnia?.symbol ?? '';

    return (
        <View>
            <GroupedListSectionTitle title={t`Amount spent`} />
            <InzhurAmountInput
                testID={InzhurSelector.PurchaseAmountInput}
                value={field.value}
                instrumentSymbol={instrumentSymbol}
                onChange={field.onChange}
            >
                <View className="flex-1">
                    <MoneyText
                        amount={field.value}
                        instrumentSymbol={instrumentSymbol}
                        variant={MoneyTextVariantEnum.FIELD}
                        tone="primary"
                    />
                </View>
            </InzhurAmountInput>
        </View>
    );
};
