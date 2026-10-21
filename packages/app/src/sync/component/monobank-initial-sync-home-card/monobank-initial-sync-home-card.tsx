import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { useMonobankInitialSyncProgressQuery } from '../../query/use-monobank-initial-sync-progress.query';

export const MonobankInitialSyncHomeCard = () => {
    const { t } = useLingui();
    const progress = useMonobankInitialSyncProgressQuery();

    if (!isDefined(progress)) {
        return null;
    }

    const { percent, minutesLeft } = progress;
    const percentText = `${percent}%`;
    const etaText = t({ message: plural(minutesLeft, { one: 'About # minute left', other: 'About # minutes left' }) });

    return (
        <Card variant="ghost" size="sm" className="gap-y-md">
            <View className="flex-row items-center gap-x-md">
                <Icon icon={UserIconNameEnum.History} size={16} className="text-cyan-foreground" />
                <Text className="flex-1 text-sm font-medium text-primary" numberOfLines={1}>
                    <Trans>Importing Monobank history</Trans>
                </Text>
                <Text className="text-sm text-secondary-foreground">{percentText}</Text>
            </View>

            <AiProgressBar progress={percent} />

            <Text className="text-sm text-secondary-foreground">{etaText}</Text>
        </Card>
    );
};
