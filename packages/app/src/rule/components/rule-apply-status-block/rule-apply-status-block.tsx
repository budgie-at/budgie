import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { RuleApplyStatusInterface } from '../../interface/rule-apply-status.interface';
import { RuleApplyStatusChip } from '../rule-apply-status-chip/rule-apply-status-chip';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';

interface Props {
    readonly status: RuleApplyStatusInterface;
}

export const RuleApplyStatusBlock = ({ status }: Props) => {
    if (!status.available) {
        return null;
    }

    if (status.isLoading) {
        return (
            <View
                testID={RuleFormSelector.StatusBlock}
                className="bg-secondary-background border-secondary-corner items-center rounded-2xl border py-xl"
            >
                <ActivityIndicator />
            </View>
        );
    }

    if (status.matched === 0) {
        return (
            <View
                testID={RuleFormSelector.StatusBlock}
                className="bg-secondary-background border-secondary-corner rounded-2xl border px-xl py-md"
            >
                <Text className="text-secondary-foreground text-sm">
                    <Trans>No matching transactions</Trans>
                </Text>
            </View>
        );
    }

    return (
        <View testID={RuleFormSelector.StatusBlock} className="flex-row gap-x-md">
            <RuleApplyStatusChip value={status.matched} className="text-primary">
                <Trans>Matched</Trans>
            </RuleApplyStatusChip>
            <RuleApplyStatusChip value={status.applied} className="text-positive-foreground">
                <Trans>Applied</Trans>
            </RuleApplyStatusChip>
            <RuleApplyStatusChip value={status.pending} className="text-warning-foreground">
                <Trans>Pending</Trans>
            </RuleApplyStatusChip>
        </View>
    );
};
