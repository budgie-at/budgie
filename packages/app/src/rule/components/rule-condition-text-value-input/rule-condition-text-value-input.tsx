import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Platform, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Input } from '../../../@generic/component/input/input';
import { isValidRulePattern } from '../../utils/is-valid-rule-pattern.util';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const MONOSPACE_STYLE = { fontFamily: Platform.select({ ios: 'menlo', default: 'monospace' }) };

export const RuleConditionTextValueInput = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const field = useWatch({ control, name: `conditions.${index}.field` });
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const {
        field: { value, onChange, onBlur }
    } = useController({ control, name: `conditions.${index}.value` });

    const isPattern = operator === RuleConditionOperatorEnum.MATCHES_REGEX;
    const isPatternInvalid = isPattern && isNotEmptyString(value) && !isValidRulePattern(value);
    const textPlaceholder = field === RuleConditionFieldEnum.COMMENT ? t`e.g. lunch with team` : t`e.g. Netflix`;
    const placeholder = isPattern ? t`e.g. ^uber.*trip` : textPlaceholder;
    const hint = isPatternInvalid ? t`This pattern isn't valid yet` : t`Letter case is ignored`;
    const hintClassName = isPatternInvalid ? 'text-[13px] text-destructive-foreground' : 'text-[13px] text-secondary-foreground';

    return (
        <View className="flex-1 pb-xs">
            <Input
                testID={testID}
                borderless
                size="md"
                className="px-0 text-[17px]"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                accessibilityLabel={t`Value`}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                {...(isPattern && { style: MONOSPACE_STYLE })}
            />
            {isPattern ? <Text className={hintClassName}>{hint}</Text> : null}
        </View>
    );
};
