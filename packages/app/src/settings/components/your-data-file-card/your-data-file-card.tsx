import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useSetting } from '../../hook/use-setting.hook';

export const YourDataFileCard = () => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();

    const fileSize = formatFileSize(databaseFileSize);
    const statusClassName = isPinEnabled
        ? 'border-positive-corner bg-positive-background text-positive-foreground'
        : 'border-secondary-corner bg-secondary-background text-secondary-foreground';
    const statusIcon = isPinEnabled ? UserIconNameEnum.Lock : UserIconNameEnum.LockOpen;
    const statusLabel = isPinEnabled ? t`Sealed` : t`Phone lock only`;

    return (
        <Card variant="secondary" size="md" className="flex-row items-center gap-x-lg">
            <CircleIcon icon={UserIconNameEnum.Database} variant="primary" size={40} iconSize={20} />

            <View className="flex-1">
                <Text className="text-primary text-md font-semibold">{DB_NAME}</Text>
                <Text className="text-secondary-foreground text-xs">
                    <Trans>{fileSize} · on this phone</Trans>
                </Text>
            </View>

            <View className={cn('flex-row items-center gap-x-xs rounded-full border px-md py-xs', statusClassName)}>
                <Icon icon={statusIcon} size={12} className={statusClassName} />
                <Text className={cn('text-xs font-medium', statusClassName)}>{statusLabel}</Text>
            </View>
        </Card>
    );
};
