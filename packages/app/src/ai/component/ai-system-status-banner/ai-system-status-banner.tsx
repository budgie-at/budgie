import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { aiUmbrellaStatusAtom } from '../../constant/ai-umbrella-status-atom.constant';
import { AiSystemUmbrellaStateEnum } from '../../enum/ai-system-umbrella-state.enum';

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

    const icon = umbrella.state === AiSystemUmbrellaStateEnum.INITIALIZING ? UserIconNameEnum.LoaderCircle : UserIconNameEnum.TriangleAlert;

    return (
        <GroupedListRow
            title={t`On-device AI`}
            left={<GroupedListIcon icon={icon} />}
            right={<Text className="max-w-[60%] text-[17px] text-secondary-foreground">{umbrella.statusText}</Text>}
        />
    );
};
