import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ListRow } from '../../../@generic/component/list-row/list-row';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInzhurFreshnessQuery } from '../../query/use-inzhur-freshness.query';
import { useInzhurStatementReminderQuery } from '../../query/use-inzhur-statement-reminder.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurImportStatementAction = () => {
    const { t } = useLingui();
    const reminder = useInzhurStatementReminderQuery();
    const freshness = useInzhurFreshnessQuery();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const statementDate = isDefined(freshness?.statementDate) ? formatMonthAndDayAndOptionalYear(parseISO(freshness.statementDate)) : '';

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

    const ageLabel = t({ message: plural(reminder.daysOld, { one: 'Statement # day ago', other: 'Statement # days ago' }) });

    return (
        <HapticPressable
            onPress={handleImport}
            accessibilityRole="button"
            accessibilityLabel={t`${ageLabel}. Import statement`}
            className="min-h-[56px] rounded-3xl bg-grouped-surface-row px-3xl py-[12px] active:opacity-70"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.ImportStatementButton}
        >
            <ListRow
                leading={<NeutralIconTile icon={UserIconNameEnum.Clock} iconClassName="text-warning-strong" />}
                title={
                    <Text className="text-[17px] font-semibold text-primary" testID={InzhurSelector.StatementReminder}>
                        {ageLabel}
                    </Text>
                }
                trailing={
                    <Text className="text-[17px] font-semibold text-default-foreground">
                        <Trans>Import</Trans>
                    </Text>
                }
                detail={<Text className="text-[13px] leading-[18px] text-secondary-foreground">{t`Last one ${statementDate}`}</Text>}
            />
        </HapticPressable>
    );
};
