import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AiEmbeddingStatusCard } from '../ai-embedding-status-card/ai-embedding-status-card';
import { AiFeatureToggle } from '../ai-feature-toggle/ai-feature-toggle';
import { AiOnDeviceLinkCard } from '../ai-on-device-link-card/ai-on-device-link-card';
import { AiSystemStatusBanner } from '../ai-system-status-banner/ai-system-status-banner';
import { AiTranslationStatusCard } from '../ai-translation-status-card/ai-translation-status-card';

export const AiSettingsSection = () => {
    const { t } = useLingui();
    const isAiEnabled = useSetting('isAiEnabled');
    const isAiSuggestionsEnabled = useSetting('isAiSuggestionsEnabled');
    const isAiTranslationsEnabled = useSetting('isAiTranslationsEnabled');

    return (
        <>
            <AiFeatureToggle
                settingKey="isAiVoiceInputEnabled"
                title={t`Voice notes`}
                description={t`Speak an expense and Budgie fills in the transaction.`}
                icon={UserIconNameEnum.Mic}
            />
            <AiFeatureToggle
                settingKey="isAiSuggestionsEnabled"
                title={t`Smart suggestions`}
                description={t`Get category, tag, and note suggestions from your history.`}
                icon={UserIconNameEnum.Sparkles}
            />
            <AiFeatureToggle
                settingKey="isAiTranslationsEnabled"
                title={t`Translate categories and tags`}
                description={t`Generate English names and search keywords automatically.`}
                icon={UserIconNameEnum.Languages}
            />
            {isAiEnabled ? <AiOnDeviceLinkCard /> : null}
            {isAiEnabled ? <AiSystemStatusBanner /> : null}
            {isAiTranslationsEnabled ? <AiTranslationStatusCard /> : null}
            {isAiSuggestionsEnabled ? <AiEmbeddingStatusCard /> : null}
        </>
    );
};
