import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { aiEmbeddingStatusAtom } from '../../constant/ai-embedding-status-atom.constant';
import { AiEmbeddingStatusService } from '../../service/ai-embedding-status.service';
import { AiSubsystemCard } from '../ai-subsystem-card/ai-subsystem-card';

const handleRebuild = () =>
    appRuntime.runPromise(Effect.flatMap(AiEmbeddingStatusService, aiEmbeddingStatusService => aiEmbeddingStatusService.rebuild()));

export const AiEmbeddingStatusCard = () => {
    const snapshot = useAtomValue(aiEmbeddingStatusAtom);
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
