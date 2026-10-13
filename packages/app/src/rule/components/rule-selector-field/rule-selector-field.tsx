import { Text } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { RuleSelectorButton } from '../rule-selector-button/rule-selector-button';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly onPress: EmptyFn;
    readonly hint?: string;
    readonly testID?: string;
}

export const RuleSelectorField = ({ label, value, onPress, hint, testID }: Props) => (
    <FormItem label={label}>
        <RuleSelectorButton testID={testID} value={value} onPress={onPress} />

        {isNotEmptyString(hint) ? <Text className="text-secondary-foreground text-xs">{hint}</Text> : null}
    </FormItem>
);
