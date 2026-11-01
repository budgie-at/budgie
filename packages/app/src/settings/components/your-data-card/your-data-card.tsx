import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Platform } from 'react-native';

import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { ImportDatabase } from '../../../import/components/import-database/import-database';
import { BackupRow } from '../backup-row/backup-row';
import { SettingsRow } from '../settings-row/settings-row';

export const YourDataCard = () => {
    const { t } = useLingui();
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();

    const fileSize = formatFileSize(databaseFileSize);
    const title = Platform.OS === 'ios' ? t`On this iPhone` : t`On this phone`;

    return (
        <>
            <SettingsRow
                icon={UserIconNameEnum.Smartphone}
                variant="ghost"
                title={title}
                testID={SettingsPageSelector.YourDataCard}
                subtitle={t`${fileSize} · Stored only on this device`}
            />
            <BackupRow />
            <ImportDatabase />
        </>
    );
};
