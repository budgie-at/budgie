import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { AiSystemUmbrellaStateEnum } from '../../enum/ai-system-umbrella-state.enum';
import { useAiSystemUmbrella } from '../../hook/use-ai-system-umbrella.hook';

const ICON_SIZE = 14;

const BANNER_ICON: Record<AiSystemUmbrellaStateEnum, UserIconNameEnum | null> = {
    [AiSystemUmbrellaStateEnum.Disabled]: UserIconNameEnum.CircleAlert,
    [AiSystemUmbrellaStateEnum.Downloading]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.Initializing]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.ModelError]: UserIconNameEnum.TriangleAlert,
    [AiSystemUmbrellaStateEnum.Healthy]: null
};

const BANNER_COLOR: Record<AiSystemUmbrellaStateEnum, string> = {
    [AiSystemUmbrellaStateEnum.Disabled]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.Downloading]: 'text-primary-foreground',
    [AiSystemUmbrellaStateEnum.Initializing]: 'text-warning-foreground',
    [AiSystemUmbrellaStateEnum.ModelError]: 'text-destructive-foreground',
    [AiSystemUmbrellaStateEnum.Healthy]: 'text-muted-foreground'
};

export const AiSystemStatusBanner = () => {
    const umbrella = useAiSystemUmbrella();
    const isHealthy = umbrella.state === AiSystemUmbrellaStateEnum.Healthy;

    if (isHealthy) {
        return null;
    }

    const icon = BANNER_ICON[umbrella.state];
    const colorClass = BANNER_COLOR[umbrella.state];
    const showPercent = umbrella.state === AiSystemUmbrellaStateEnum.Downloading && umbrella.downloadPercent > 0;

    return (
        <View className="flex-row items-center gap-x-sm px-lg py-md bg-secondary-background rounded-xl">
            {icon !== null && <Icon icon={icon} size={ICON_SIZE} className={colorClass} />}
            <Text className={`flex-1 text-xs font-medium ${colorClass}`} numberOfLines={1}>
                {umbrella.statusText}
            </Text>
            {showPercent && <Text className={`text-xs font-medium ${colorClass}`}>{`${umbrella.downloadPercent}%`}</Text>}
        </View>
    );
};
