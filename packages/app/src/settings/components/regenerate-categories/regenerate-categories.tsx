import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useRegenerateAllCategories } from '../../../category/hooks/use-regenerate-all-categories.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const RegenerateCategories = () => {
    const { t } = useLingui();
    const { regenerateAll, isRegenerating } = useRegenerateAllCategories();

    const handleRegenerate = () => void regenerateAll();

    return (
        <SettingsCard
            onPress={handleRegenerate}
            isLoading={isRegenerating}
            title={t`Regenerate AI Data`}
            description={t`Regenerate translations and search keywords for all categories`}
            icon={UserIconNameEnum.Sparkles}
            variant="secondary"
        />
    );
};
