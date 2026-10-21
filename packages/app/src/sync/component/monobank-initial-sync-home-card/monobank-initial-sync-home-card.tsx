import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { useMonobankInitialSyncProgressQuery } from '../../query/use-monobank-initial-sync-progress.query';

import { MonobankInitialSyncHomeCardSelector } from './monobank-initial-sync-home-card.selector';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export const MonobankInitialSyncHomeCard = () => {
    const { t } = useLingui();
    const progress = useMonobankInitialSyncProgressQuery();

    if (!isDefined(progress)) {
        return null;
    }

    const minutesLeft = Math.max(1, Math.ceil(progress.etaSeconds / SECONDS_PER_MINUTE));
    const hoursLeft = Math.round(minutesLeft / MINUTES_PER_HOUR);
    const minutesText = t({ message: plural(minutesLeft, { one: 'About # minute left', other: 'About # minutes left' }) });
    const hoursText = t({ message: plural(hoursLeft, { one: 'About # hour left', other: 'About # hours left' }) });
    const etaText = minutesLeft < MINUTES_PER_HOUR ? minutesText : hoursText;
    const percentText = `${progress.percent}%`;

    return (
        <Card testID={MonobankInitialSyncHomeCardSelector.Root} variant="ghost" size="sm" className="gap-y-md">
            <View className="flex-row items-center gap-x-md">
                <Icon icon={UserIconNameEnum.History} size={16} className="text-cyan-foreground" />
                <Text className="flex-1 text-sm font-medium text-primary" numberOfLines={1}>
                    <Trans>Importing Monobank history</Trans>
                </Text>
                <Text className="text-sm text-secondary-foreground">{percentText}</Text>
            </View>

            <AiProgressBar progress={progress.percent} />

            <Text className="text-sm text-secondary-foreground">{etaText}</Text>
        </Card>
    );
};
