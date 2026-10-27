import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { isAiEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { AiModelStorage } from '../../../ai/component/ai-model-storage/ai-model-storage';
import { AiSettingsSection } from '../../../ai/component/ai-settings-section/ai-settings-section';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { AiFeaturesPageSelector } from './ai-features-page.selector';

export default function AiFeaturesPage() {
    const { t } = useLingui();
    const isAiBuildEnabled = isAiEnabled();

    return (
        <CollapsibleChromePage
            title={t`AI features`}
            subtitle={t`Models download once, best on Wi-Fi`}
            leading={<GoBackButton onPress={goBackToSettings} />}
            testID={AiFeaturesPageSelector.Container}
        >
            <View className="gap-y-lg pb-5xl">
                {isAiBuildEnabled ? <AiSettingsSection /> : null}
                <AiModelStorage />
                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}
