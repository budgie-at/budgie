import { TRANSACTION_TITLE_MAX_LENGTH, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TextInput } from 'react-native';

import { TransactionKeypadContext } from '../../context/transaction-keypad.context';

export const TransactionMerchantInput = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const { dismiss } = use(TransactionKeypadContext);
    const title = useWatch({ control, name: 'title' });
    const handleChange = (value: string) => void setValue('title', value, { shouldDirty: true });

    return (
        <TextInput
            value={title}
            onFocus={dismiss}
            maxLength={TRANSACTION_TITLE_MAX_LENGTH}
            onChangeText={handleChange}
            accessibilityLabel={t`Merchant or payment description`}
            placeholder={t`Merchant or payment description`}
            placeholderTextColorClassName="accent-secondary-foreground"
            className="min-h-[44px] self-stretch px-xl text-center text-[17px] text-primary"
            maxFontSizeMultiplier={1.35}
            returnKeyType="done"
        />
    );
};
