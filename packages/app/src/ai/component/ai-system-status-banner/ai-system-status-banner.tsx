import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { AiSystemUmbrellaStateEnum } from '../../enum/ai-system-umbrella-state.enum';
import { useAiSystemUmbrella } from '../../hook/use-ai-system-umbrella.hook';

const ICON_SIZE = 14;

const BANNER_ICON: Record<AiSystemUmbrellaStateEnum, UserIconNameEnum | null> = {
    [AiSystemUmbrellaStateEnum.Disabled]: UserIconNameEnum.CircleAlert,
    [AiSystemUmbrellaStateEnum.Downloading]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.Healthy]: null,
    [AiSystemUmbrellaStateEnum.Idle]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.Initializing]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.ModelError]: UserIconNameEnum.TriangleAlert,
    [AiSystemUmbrellaStateEnum.Suspended]: UserIconNameEnum.LoaderCircle
};

const BANNER_COLOR: Record<AiSystemUmbrellaStateEnum, string> = {
    [AiSystemUmbrellaStateEnum.Disabled]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.Downloading]: 'text-primary-foreground',
    [AiSystemUmbrellaStateEnum.Healthy]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.Idle]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.Initializing]: 'text-warning-foreground',
    [AiSystemUmbrellaStateEnum.ModelError]: 'text-destructive-foreground',
    [AiSystemUmbrellaStateEnum.Suspended]: 'text-warning-foreground'
};

export const AiSystemStatusBanner = () => {
    const umbrella = useAiSystemUmbrella();
    const isHealthy = umbrella.state === AiSystemUmbrellaStateEnum.Healthy;

    if (isHealthy) {
        return null;
    }

    const icon = BANNER_ICON[umbrella.state];
    const colorClass = BANNER_COLOR[umbrella.state];
    const showPercent = umbrella.state === AiSystemUmbrellaStateEnum.Downloading && isPositiveNumber(umbrella.downloadPercent);

    return (
        <View className="flex-row items-center gap-x-sm px-lg py-md bg-secondary-background rounded-xl">
            {isDefined(icon) && <Icon icon={icon} size={ICON_SIZE} className={colorClass} />}
            <Text className={cn('flex-1 text-xs font-medium', colorClass)} numberOfLines={1}>
                {umbrella.statusText}
            </Text>
            {showPercent && <Text className={cn('text-xs font-medium', colorClass)}>{`${umbrella.downloadPercent}%`}</Text>}
        </View>
    );
};
