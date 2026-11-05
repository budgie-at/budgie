import { SyncHistoryDepthEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { SyncHistoryDepthStep } from '../sync-history-depth-step/sync-history-depth-step';

interface Props {
    readonly selectedDepth: SyncHistoryDepthEnum;
    readonly onSelect: (depth: SyncHistoryDepthEnum) => void;
}

export const EnableBankingHistoryStep = ({ selectedDepth, onSelect }: Props) => {
    const { t } = useLingui();

    const hintByDepth = {
        [SyncHistoryDepthEnum.MONTH_1]: t`Everything from the last month`,
        [SyncHistoryDepthEnum.MONTHS_3]: t`Everything from the last 3 months`,
        [SyncHistoryDepthEnum.MONTHS_6]: t`Everything from the last 6 months`,
        [SyncHistoryDepthEnum.YEAR_1]: t`Everything from the last year`,
        [SyncHistoryDepthEnum.FULL]: t`As far back as your bank allows`,
        [SyncHistoryDepthEnum.NEW_ONLY]: t`Nothing from the past is imported`
    };

    return (
        <SyncHistoryDepthStep
            selectedDepth={selectedDepth}
            description={t`Choose how far back to import. Your bank sends it in one go, and it may keep less than you ask for.`}
            hintByDepth={hintByDepth}
            onSelect={onSelect}
        />
    );
};
