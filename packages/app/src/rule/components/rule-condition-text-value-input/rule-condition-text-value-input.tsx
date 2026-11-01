import { RuleCreateInputInterface } from '@budgie/contracts';
import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Platform } from 'react-native';

import { Input } from '../../../@generic/component/input/input';
import { useRuleTextValueMeta } from '../../hooks/use-rule-text-value-meta.hook';
import { RuleValueField } from '../rule-value-field/rule-value-field';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const MONOSPACE_STYLE = { fontFamily: Platform.select({ ios: 'menlo', default: 'monospace' }) };

export const RuleConditionTextValueInput = ({ index, testID }: Props) => {
    const [isFocused, setIsFocused] = useState(false);
    const { control } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value, onChange, onBlur, ref }
    } = useController({ control, name: `conditions.${index}.value` });
    const { isPattern, placeholder, hint, isHintWarning, accessibilityLabel } = useRuleTextValueMeta(index);

    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => {
        setIsFocused(false);
        onBlur();
    };

    return (
        <RuleValueField isFocused={isFocused} hint={hint} isHintWarning={isHintWarning}>
            <Input
                ref={ref}
                testID={testID}
                borderless
                size="md"
                className="flex-1 px-0 text-[17px]"
                value={value}
                onChangeText={onChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                accessibilityLabel={accessibilityLabel}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                clearButtonMode="while-editing"
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                {...(isPattern && { style: MONOSPACE_STYLE })}
            />
        </RuleValueField>
    );
};
