import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { SyncHistoryDepthEnum } from '../../enum/sync-history-depth.enum';

interface Props {
    readonly depth: SyncHistoryDepthEnum;
}

export const SyncHistoryDurationNotice = ({ depth }: Props) => {
    const { t } = useLingui();

    const noticeByDepth: Record<SyncHistoryDepthEnum, string | null> = {
        [SyncHistoryDepthEnum.MONTH_1]: null,
        [SyncHistoryDepthEnum.MONTHS_3]: null,
        [SyncHistoryDepthEnum.MONTHS_6]: null,
        [SyncHistoryDepthEnum.YEAR_1]: t`Runs in the background, and much slower while the app is closed.`,
        [SyncHistoryDepthEnum.FULL]: t`Can run for hours on old accounts, and much slower while the app is closed.`,
        [SyncHistoryDepthEnum.NEW_ONLY]: null
    };
    const notice = noticeByDepth[depth];

    if (!isDefined(notice)) {
        return null;
    }

    return (
        <SimpleHorizontalCell
            left={<CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="warning" size={15} iconSize={15} />}
            size="md"
            variant="warning"
            title={notice}
        />
    );
};
