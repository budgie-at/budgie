import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { aiTranslationStatusAtom } from '../../constant/ai-translation-status-atom.constant';
import { AiTranslationStatusService } from '../../service/ai-translation-status.service';
import { AiSubsystemCard } from '../ai-subsystem-card/ai-subsystem-card';

const rebuildEffect = Effect.flatMap(AiTranslationStatusService, aiTranslationStatusService => aiTranslationStatusService.rebuild());

export const AiTranslationStatusCard = () => {
    const snapshot = useAtomValue(aiTranslationStatusAtom);
    const { t } = useLingui();

    return (
        <AiSubsystemCard
            snapshot={snapshot}
            icon={UserIconNameEnum.Languages}
            title={<Trans>Translation</Trans>}
            rebuildAlertTitle={t`Rebuild translations`}
            rebuildAlertMessage={t`This re-translates every category and tag. Continue?`}
            rebuildLogKey="system:action:translation:rebuild:user-throw"
            onRebuild={rebuildEffect}
        />
    );
};
