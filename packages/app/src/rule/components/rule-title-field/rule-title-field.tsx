import { RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleTextInput } from '../rule-text-input/rule-text-input';

export const RuleTitleField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const placeholder = t`e.g., Grocery Transactions`;

    const renderTitleInput = ({ field: { value, onChange } }: { field: { value: string; onChange: (value: string) => void } }) => (
        <RuleTextInput value={value} onChange={onChange} placeholder={placeholder} />
    );

    return (
        <View>
            <Text className="text-secondary-foreground text-xs mb-xs"><Trans>Title</Trans></Text>
            <Controller control={control} name="title" render={renderTitleInput} />
        </View>
    );
};
