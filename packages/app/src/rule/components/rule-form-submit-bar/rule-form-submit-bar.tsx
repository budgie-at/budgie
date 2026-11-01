import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics';
import { use } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { EdgeFade } from '@rnw-community/react-native-screen-chrome';
import { emptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { RuleFormScrollContext } from '../../context/rule-form-scroll.context';
import { getRuleFormIssue } from '../../utils/get-rule-form-issue.util';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

interface Props {
    readonly submitLabel: string;
    readonly isSubmitting: boolean;
    readonly onSubmit: () => void;
}

const DISABLED_STATE = { disabled: true };
const FADE_HEIGHT = 150;

export const RuleFormSubmitBar = ({ submitLabel, isSubmitting, onSubmit }: Props) => {
    const { t } = useLingui();
    const { handleSubmit, setFocus } = useFormContext<RuleCreateInputInterface>();
    const [conditions, actions] = useWatch<RuleCreateInputInterface, ['conditions', 'actions']>({ name: ['conditions', 'actions'] });
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const scrollRef = use(RuleFormScrollContext);
    const [hapticNotification] = useVibration();
    const issue = getRuleFormIssue({ conditions, actions });

    if (isKeyboardVisible) {
        return null;
    }

    const handleRevealIssue = () => {
        hapticNotification(NotificationFeedbackType.Warning);
        void handleSubmit(emptyFn)();

        if (isDefined(issue?.conditionIndex)) {
            scrollRef?.current?.scrollTo({ y: 0, animated: true });
            setFocus(`conditions.${issue.conditionIndex}.value`);

            return;
        }

        scrollRef?.current?.scrollToEnd({ animated: true });
    };

    const button = (
        <PillButton
            label={submitLabel}
            isLoading={isSubmitting}
            isDisabled={isDefined(issue)}
            testID={RuleFormSelector.SubmitButton}
            onPress={onSubmit}
        />
    );

    return (
        <View className="px-5xl pt-4xl">
            <EdgeFade position="bottom" height={FADE_HEIGHT} />
            <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
            <View className="z-10">
                {isDefined(issue) ? (
                    <HapticPressable
                        onPress={handleRevealIssue}
                        accessibilityRole="button"
                        accessibilityLabel={submitLabel}
                        accessibilityState={DISABLED_STATE}
                        accessibilityHint={t(issue.message)}
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
