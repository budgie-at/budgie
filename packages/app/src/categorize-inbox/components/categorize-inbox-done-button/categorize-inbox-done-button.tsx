import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { CategorizeInboxCtaButton } from '../categorize-inbox-cta-button/categorize-inbox-cta-button';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

export const CategorizeInboxDoneButton = () => {
    const { t } = useLingui();
    const router = useRouter();

    const handlePress = (): void => void router.back();

    return <CategorizeInboxCtaButton label={t`Done`} testID={CategorizeInboxPanelSelector.DoneButton} onPress={handlePress} />;
};
