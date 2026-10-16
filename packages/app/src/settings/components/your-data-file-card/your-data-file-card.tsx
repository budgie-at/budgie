import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { SecurityStatusBadge } from '../../../auth/components/security-status-badge/security-status-badge';

export const YourDataFileCard = () => {
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();

    const fileSize = formatFileSize(databaseFileSize);

    return (
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
    );
};
