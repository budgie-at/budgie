import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInzhurFreshnessQuery } from '../../query/use-inzhur-freshness.query';
import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const bannerVariants = cva('min-h-[56px] rounded-3xl bg-grouped-surface-row py-[12px] pr-xs pl-3xl', {
    variants: { isStacked: { true: 'items-start gap-y-md', false: 'flex-row items-center gap-x-md' } }
});

export const InzhurImportStatementAction = () => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();
    const freshness = useInzhurFreshnessQuery();
    const isStacked = useIsAccessibilityTextSize();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const statementDate = isDefined(freshness?.statementDate) ? formatMonthAndDayAndOptionalYear(freshness.statementDate) : '';

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
                trailing={<Text className="text-[15px] text-secondary-foreground tabular-nums">{t`Last ${statementDate}`}</Text>}
                testID={InzhurSelector.ImportStatementButton}
            />
        );
    }

    const ageLabel = t({ message: plural(reminder.daysOld, { one: '# day ago', other: '# days ago' }) });

    return (
        <View className={bannerVariants({ isStacked })} style={CONTINUOUS_CORNERS}>
            <View className="min-w-0 flex-1 flex-row items-center gap-x-xl self-stretch">
                <NeutralIconTile icon={UserIconNameEnum.Clock} iconClassName="text-warning-strong" />
                <View className="flex-1 gap-y-xxs" testID={InzhurSelector.StatementReminder}>
                    <Text className="text-[17px] text-primary">{t`Last statement ${statementDate}`}</Text>
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground">{ageLabel}</Text>
                </View>
            </View>
            <HapticPressable
                onPress={handleImport}
                accessibilityRole="button"
                accessibilityLabel={t`Import statement`}
                className="min-h-[44px] min-w-[44px] items-center justify-center px-md active:opacity-70"
                testID={InzhurSelector.ImportStatementButton}
            >
                <Text className="text-[15px] font-semibold text-default-foreground">
                    <Trans>Import</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
