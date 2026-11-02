import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { aiUmbrellaStatusAtom } from '../../constant/ai-umbrella-status-atom.constant';
import { AiSystemUmbrellaStateEnum } from '../../enum/ai-system-umbrella-state.enum';

const BANNER_ICON: Record<AiSystemUmbrellaStateEnum, UserIconNameEnum | null> = {
    [AiSystemUmbrellaStateEnum.DISABLED]: UserIconNameEnum.CircleAlert,
    [AiSystemUmbrellaStateEnum.DOWNLOADING]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.HEALTHY]: null,
    [AiSystemUmbrellaStateEnum.INITIALIZING]: UserIconNameEnum.LoaderCircle,
    [AiSystemUmbrellaStateEnum.MODEL_ERROR]: UserIconNameEnum.TriangleAlert
};

export const AiSystemStatusBanner = () => {
    const { t } = useLingui();
    const umbrella = useAtomValue(aiUmbrellaStatusAtom);
    const isHidden =
        umbrella.state === AiSystemUmbrellaStateEnum.HEALTHY ||
        umbrella.state === AiSystemUmbrellaStateEnum.DISABLED ||
        umbrella.state === AiSystemUmbrellaStateEnum.DOWNLOADING;

    if (isHidden) {
        return null;
    }

    const icon = BANNER_ICON[umbrella.state];

    const left = isDefined(icon) ? <GroupedListIcon icon={icon} /> : void 0;

    return (
        <GroupedListRow
            title={t`On-device AI`}
            left={left}
            right={<Text className="max-w-[60%] text-[17px] text-secondary-foreground">{umbrella.statusText}</Text>}
        />
    );
};
