import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { AI_DOWNLOAD_CARD_VISUALS } from '../../constant/ai-download-card-visuals.constant';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';

import type { PropsWithChildren } from 'react';

interface Props {
    readonly status: AiModelDownloadStatusEnum;
    readonly testID?: string;
}

export const AiDownloadCardFrame = ({ status, testID, children }: PropsWithChildren<Props>) => {
    const { t } = useLingui();

    const { icon, variant, label } = AI_DOWNLOAD_CARD_VISUALS[status];

    return (
        <Card variant={variant} size="md" className="gap-y-lg" testID={testID}>
            <View className="flex-row items-center gap-x-sm">
                <Icon icon={icon} size={16} className={cn(FOREGROUND_COLOR_PALETTE[variant])} />
                <Text className={cn('text-sm font-semibold', FOREGROUND_COLOR_PALETTE[variant])}>{t(label)}</Text>
            </View>

            {children}
        </Card>
    );
};
