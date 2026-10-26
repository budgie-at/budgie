import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Platform, Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { BackupRow } from '../backup-row/backup-row';

export const YourDataCard = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();

    const fileSize = formatFileSize(databaseFileSize);
    const title = Platform.OS === 'ios' ? t`On this iPhone` : t`On this phone`;
    const encryptionLabel = isPinEnabled ? t`With your PIN` : t`Off`;
    const encryptionClassName = isPinEnabled ? 'text-positive-foreground' : 'text-primary';
    const encryptionTestID = isPinEnabled ? SettingsPageSelector.DataEncryptionStateOn : SettingsPageSelector.DataEncryptionStateOff;

    return (
        <Card variant="secondary" size="sm" className="px-3xl py-0" testID={SettingsPageSelector.YourDataCard}>
            <View className="flex-row items-center gap-x-lg py-xl">
                <CircleIcon icon={UserIconNameEnum.Smartphone} variant="positive" border={false} size={40} iconSize={20} />

                <View className="flex-1">
                    <Text className="text-md font-semibold text-primary" numberOfLines={1}>
                        {title}
                    </Text>
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        <Trans>{fileSize} · no Budgie servers</Trans>
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center justify-between gap-x-lg border-t border-secondary-corner py-lg">
                <Text className="text-sm text-secondary-foreground">{t`Encryption`}</Text>
                <Text className={cn('text-sm font-semibold', encryptionClassName)} testID={encryptionTestID}>
                    {encryptionLabel}
                </Text>
            </View>

            <View className="border-t border-secondary-corner">
                <BackupRow />
            </View>
        </Card>
    );
};
