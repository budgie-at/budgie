import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { aiEmbeddingStatusService } from '../../service/ai-embedding-status.service';
import { AiSubsystemCard } from '../ai-subsystem-card/ai-subsystem-card';

const handleRebuild = () => appRuntime.runPromise(aiEmbeddingStatusService.rebuild());

export const AiEmbeddingStatusCard = () => {
    const snapshot = useAtomValue(aiEmbeddingStatusService.snapshot);
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
