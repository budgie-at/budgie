import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurImportStatementAction = () => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();

    const handleImport = () => void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.INZHUR } });

    if (!isDefined(reminder)) {
        return (
            <GroupedListActionRow
                label={t`Import statement`}
                icon={UserIconNameEnum.FileUp}
                onPress={handleImport}
                isDisabled={false}
                isLoading={false}
                labelClassName="text-primary"
                testID={InzhurSelector.ImportStatementButton}
            />
        );
    }

    const staleLabel = t({ message: plural(reminder.daysOld, { one: 'Statement is # day old', other: 'Statement is # days old' }) });

    return (
        <HapticPressable
            onPress={handleImport}
            accessibilityRole="button"
            accessibilityLabel={`${staleLabel}. ${t`Import statement`}`}
            className="min-h-[52px] flex-row items-start gap-x-md rounded-3xl bg-warning-background px-3xl py-lg active:opacity-70"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.ImportStatementButton}
        >
            <Icon icon={UserIconNameEnum.Clock} size={20} className="text-warning-strong" />
            <View className="flex-1 items-start gap-y-md">
                <Text className="text-[15px] font-medium text-warning-strong" testID={InzhurSelector.StatementReminder}>
                    {staleLabel}
                </Text>
                <View className="min-h-[32px] justify-center rounded-full bg-cta-background px-xl">
                    <Text className="text-[15px] font-semibold text-cta-foreground">
                        <Trans>Import statement</Trans>
                    </Text>
                </View>
            </View>
        </HapticPressable>
    );
};
