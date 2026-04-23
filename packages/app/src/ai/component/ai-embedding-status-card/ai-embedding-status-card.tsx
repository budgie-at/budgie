import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';

import { useAiEmbeddingStatus } from '../../hook/use-ai-embedding-status.hook';
import { aiEmbeddingStatusService } from '../../service/ai-embedding-status.service';
import { AiSubsystemCard } from '../ai-subsystem-card/ai-subsystem-card';

const handleRebuild = () => aiEmbeddingStatusService.rebuild();

export const AiEmbeddingStatusCard = () => {
    const snapshot = useAiEmbeddingStatus();
    const { t } = useLingui();

    return (
        <AiSubsystemCard
            snapshot={snapshot}
            icon={UserIconNameEnum.Brain}
            title={<Trans>Learning</Trans>}
            rebuildAlertTitle={t`Rebuild learning`}
            rebuildAlertMessage={t`This re-indexes every transaction. Continue?`}
            rebuildLogKey="system:action:embedding:rebuild:user-throw"
            onRebuild={handleRebuild}
        />
    );
};
