import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { AiSystemUmbrellaStateEnum } from '../../enum/ai-system-umbrella-state.enum';
import { useAiSystemUmbrella } from '../../hook/use-ai-system-umbrella.hook';

const ICON_SIZE = 14;

const BANNER_ICON: Record<AiSystemUmbrellaStateEnum, UserIconNameEnum | null> = {
    [AiSystemUmbrellaStateEnum.DISABLED]: UserIconNameEnum.CircleAlert,
    [AiSystemUmbrellaStateEnum.DOWNLOADING]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.HEALTHY]: null,
    [AiSystemUmbrellaStateEnum.IDLE]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.INITIALIZING]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.MODEL_ERROR]: UserIconNameEnum.TriangleAlert,
    [AiSystemUmbrellaStateEnum.SUSPENDED]: UserIconNameEnum.LoaderCircle
};

const BANNER_COLOR: Record<AiSystemUmbrellaStateEnum, string> = {
    [AiSystemUmbrellaStateEnum.DISABLED]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.DOWNLOADING]: 'text-primary-foreground',
    [AiSystemUmbrellaStateEnum.HEALTHY]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.IDLE]: 'text-muted-foreground',
    [AiSystemUmbrellaStateEnum.INITIALIZING]: 'text-warning-foreground',
    [AiSystemUmbrellaStateEnum.MODEL_ERROR]: 'text-destructive-foreground',
    [AiSystemUmbrellaStateEnum.SUSPENDED]: 'text-warning-foreground'
};

export const AiSystemStatusBanner = () => {
    const umbrella = useAiSystemUmbrella();
    const isHealthy = umbrella.state === AiSystemUmbrellaStateEnum.HEALTHY;

    if (isHealthy) {
        return null;
    }

    const icon = BANNER_ICON[umbrella.state];
    const colorClass = BANNER_COLOR[umbrella.state];
    const showPercent = umbrella.state === AiSystemUmbrellaStateEnum.DOWNLOADING && isPositiveNumber(umbrella.downloadPercent);

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
