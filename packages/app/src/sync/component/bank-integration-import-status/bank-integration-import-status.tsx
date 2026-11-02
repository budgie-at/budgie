import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly lastSyncedAt: Date | null;
}

export const BankIntegrationImportStatus = ({ lastSyncedAt }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const importDate = isDefined(lastSyncedAt) ? formatDayAndMonthAndYear(lastSyncedAt) : null;
    const importLabel = isDefined(importDate) ? t`Last import ${importDate}` : null;

    return (
        <View className="items-center gap-y-xs" testID={BankIntegrationSelector.StatusPill}>
            <Text className="text-[15px] text-secondary-foreground text-center">
                <Trans>Imported from statement files</Trans>
            </Text>
            {isDefined(importLabel) ? <Text className="text-[13px] text-secondary-foreground text-center">{importLabel}</Text> : null}
        </View>
    );
};
