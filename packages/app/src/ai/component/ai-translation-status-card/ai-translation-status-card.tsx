import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useSyncExternalStore } from 'react';

import { aiTranslationStatusService } from '../../service/ai-translation-status.service';
import { AiSubsystemCard } from '../ai-subsystem-card/ai-subsystem-card';

const handleRebuild = () => aiTranslationStatusService.rebuild();

export const AiTranslationStatusCard = () => {
    const snapshot = useSyncExternalStore(aiTranslationStatusService.subscribe, aiTranslationStatusService.getSnapshot);
    const { t } = useLingui();

    return (
        <AiSubsystemCard
            snapshot={snapshot}
            icon={UserIconNameEnum.Languages}
            title={<Trans>Translation</Trans>}
            rebuildAlertTitle={t`Rebuild translations`}
            rebuildAlertMessage={t`This re-translates every category and tag. Continue?`}
            rebuildLogKey="system:action:translation:rebuild:user-throw"
            onRebuild={handleRebuild}
        />
    );
};
