import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { getRuleFormIssue } from '../../utils/get-rule-form-issue.util';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

interface Props {
    readonly submitLabel: string;
    readonly isSubmitting: boolean;
    readonly onSubmit: () => void;
}

export const RuleFormSubmitBar = ({ submitLabel, isSubmitting, onSubmit }: Props) => {
    const { t } = useLingui();
    const [conditions, actions] = useWatch<RuleCreateInputInterface, ['conditions', 'actions']>({ name: ['conditions', 'actions'] });
    const issue = getRuleFormIssue({ conditions, actions });
    const label = isDefined(issue) ? t(issue) : submitLabel;

    return (
        <View className="bg-surface px-5xl pt-lg">
            <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
            <PillButton
                label={label}
                isLoading={isSubmitting}
                isDisabled={isDefined(issue)}
                testID={RuleFormSelector.SubmitButton}
                onPress={onSubmit}
            />
        </View>
    );
};
