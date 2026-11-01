import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { getRuleFormIssue } from '../../utils/get-rule-form-issue.util';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

interface Props {
    readonly submitLabel: string;
    readonly isSubmitting: boolean;
    readonly onSubmit: () => void;
}

const DISABLED_STATE = { disabled: true };

export const RuleFormSubmitBar = ({ submitLabel, isSubmitting, onSubmit }: Props) => {
    const { t } = useLingui();
    const { handleSubmit, setFocus } = useFormContext<RuleCreateInputInterface>();
    const [conditions, actions] = useWatch<RuleCreateInputInterface, ['conditions', 'actions']>({ name: ['conditions', 'actions'] });
    const [hapticNotification] = useVibration();
    const issue = getRuleFormIssue({ conditions, actions });
    const buttonLabel = isDefined(issue) ? t(issue.message) : submitLabel;

    const handleRevealIssue = () => {
        hapticNotification(NotificationFeedbackType.Warning);
        void handleSubmit(emptyFn)();

        if (isDefined(issue?.conditionIndex)) {
            setFocus(`conditions.${issue.conditionIndex}.value`);
        }
    };

    const button = (
        <PillButton
            label={buttonLabel}
            isLoading={isSubmitting}
            isDisabled={isDefined(issue)}
            testID={RuleFormSelector.SubmitButton}
            onPress={onSubmit}
        />
    );

    return (
        <View className="px-5xl pt-lg">
            <View
                className="absolute inset-x-0 top-0 -bottom-[64px] border-t-hairline border-surface-separator bg-surface"
                pointerEvents="none"
            />
            <View>
                {isDefined(issue) ? (
                    <HapticPressable
                        onPress={handleRevealIssue}
                        accessibilityRole="button"
                        accessibilityLabel={buttonLabel}
                        accessibilityState={DISABLED_STATE}
                        accessibilityHint={t`Shows what is missing`}
                        className="active:scale-100"
                    >
                        <View pointerEvents="none">{button}</View>
                    </HapticPressable>
                ) : (
                    button
                )}
            </View>
        </View>
    );
};
