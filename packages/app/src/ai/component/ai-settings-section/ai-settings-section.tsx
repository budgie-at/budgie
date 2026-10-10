import { isAiEnabled as isAiBuildEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AiEmbeddingStatusCard } from '../ai-embedding-status-card/ai-embedding-status-card';
import { AiEnabledToggle } from '../ai-enabled-toggle/ai-enabled-toggle';
import { AiModelStorageCard } from '../ai-model-storage-card/ai-model-storage-card';
import { AiSystemStatusBanner } from '../ai-system-status-banner/ai-system-status-banner';
import { AiTranslationStatusCard } from '../ai-translation-status-card/ai-translation-status-card';

export const AiSettingsSection = () => {
    const isAiEnabled = useSetting('isAiEnabled');
    const isAiAvailable = isAiBuildEnabled();

    return (
        <>
            {isAiAvailable ? <AiEnabledToggle /> : null}
            {isAiAvailable && isAiEnabled ? (
                <>
                    <AiSystemStatusBanner />
                    <AiTranslationStatusCard />
                    <AiEmbeddingStatusCard />
                </>
            ) : null}
            <AiModelStorageCard />
        </>
    );
};
