import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { isAiEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { AiModelStorage } from '../../../ai/component/ai-model-storage/ai-model-storage';
import { AiSettingsSection } from '../../../ai/component/ai-settings-section/ai-settings-section';

import { AiFeaturesPageSelector } from './ai-features-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function AiFeaturesPage() {
    const { t } = useLingui();
    const isAiBuildEnabled = isAiEnabled();

    return (
        <CollapsibleChromePage
            title={t`AI features`}
            subtitle={t`Models download once, best on Wi-Fi`}
            leading={<GoBackButton onPress={handleGoBack} />}
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
