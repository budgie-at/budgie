import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AiEmbeddingStatusCard } from '../ai-embedding-status-card/ai-embedding-status-card';
import { AiEnabledToggle } from '../ai-enabled-toggle/ai-enabled-toggle';
import { AiSystemStatusBanner } from '../ai-system-status-banner/ai-system-status-banner';
import { AiTranslationStatusCard } from '../ai-translation-status-card/ai-translation-status-card';

export const AiSettingsSection = () => {
    const isAiEnabled = useSetting('isAiEnabled');

    return (
        <>
            <AiEnabledToggle />
            {isAiEnabled ? (
                <>
                    <AiSystemStatusBanner />
                    <AiTranslationStatusCard />
                    <AiEmbeddingStatusCard />
                </>
            ) : null}
        </>
    );
};
