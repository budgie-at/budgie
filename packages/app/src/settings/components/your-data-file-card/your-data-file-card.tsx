import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { SecurityStatusBadge } from '../../../auth/components/security-status-badge/security-status-badge';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { OnboardingReceiptCard } from '../../../onboarding/component/onboarding-receipt-card/onboarding-receipt-card';
import { useOnboardingReceiptRows } from '../../../onboarding/hook/use-onboarding-receipt-rows.hook';
import { useSetting } from '../../hook/use-setting.hook';

export const YourDataFileCard = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const lastBackupAt = useSetting('lastBackupAt');
    const fileRows = useOnboardingReceiptRows();
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();

    const fileSize = formatFileSize(databaseFileSize);
    const lastBackupLabel = isDefined(lastBackupAt)
        ? intl.formatDate(lastBackupAt, { day: 'numeric', month: 'short', year: 'numeric' })
        : t`Never`;
    const lastBackupVariant = isDefined(lastBackupAt) ? 'primary' : 'warning';
    const receiptRows = [...fileRows, { label: t`Last backup`, value: lastBackupLabel, valueVariant: lastBackupVariant }] as const;

    return (
        <>
            <Card variant="secondary" size="md" className="flex-row items-center gap-x-lg">
                <CircleIcon icon={UserIconNameEnum.Database} variant="primary" size={40} iconSize={20} />

                <View className="flex-1">
                    <Text className="text-primary text-md font-semibold">{DB_NAME}</Text>
                    <Text className="text-secondary-foreground text-xs">
                        <Trans>{fileSize} · on this phone</Trans>
                    </Text>
                </View>

                <SecurityStatusBadge />
            </Card>

            <OnboardingReceiptCard rows={receiptRows} />
        </>
    );
};
