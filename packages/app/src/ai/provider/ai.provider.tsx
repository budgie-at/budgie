import { getLogger } from '@budgie/logger';
import { ReactNode, useEffect } from 'react';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { aiCoordinatorService } from '../service/ai-coordinator.service';
import { aiEmbeddingStatusService } from '../service/ai-embedding-status.service';
import { aiSystemStatusService } from '../service/ai-system-status.service';
import { aiTranslationStatusService } from '../service/ai-translation-status.service';
import { aiUmbrellaStatusService } from '../service/ai-umbrella-status.service';

const logger = getLogger('AiProvider');

interface Props {
    readonly children: ReactNode;
}

export const AiProvider = ({ children }: Props) => {
    const isAiEnabled = useSetting('isAiEnabled');

    useEffect(() => {
        logger.log('provider:coordinator:mount', { isAiEnabled });

        if (isAiEnabled) {
            aiCoordinatorService.start();
        }

        return () => {
            logger.log('provider:coordinator:unmount', { isAiEnabled });
            aiCoordinatorService.stop();
        };
    }, [isAiEnabled]);

    useEffect(() => {
        logger.log('provider:mount');
        aiSystemStatusService.start();
        aiUmbrellaStatusService.start();
        aiTranslationStatusService.start();
        aiEmbeddingStatusService.start();

        return () => {
            logger.log('provider:unmount');
            aiEmbeddingStatusService.stop();
            aiTranslationStatusService.stop();
            aiUmbrellaStatusService.stop();
            aiSystemStatusService.stop();
        };
    }, []);

    return <>{children}</>;
};
