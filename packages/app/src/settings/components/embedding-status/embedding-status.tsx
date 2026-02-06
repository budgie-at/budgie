import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useEmbeddingStatus } from '../../hook/use-embedding-status.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const EmbeddingStatus = () => {
    const { t } = useLingui();
    const { embeddedCount, totalUniqueTitles, isLlmReady } = useEmbeddingStatus();

    const statusDescription = isLlmReady ? t`${embeddedCount} of ${totalUniqueTitles} titles embedded` : t`AI model not loaded`;

    return <SettingsCard description={statusDescription} icon={UserIconNameEnum.Brain} title={t`Embedding Index`} variant="secondary" />;
};
