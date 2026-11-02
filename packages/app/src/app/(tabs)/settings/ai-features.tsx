import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
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
        <GroupedSurface>
            <CollapsibleChromePage
                scrimClassName="bg-surface"
                title={t`AI features`}
                leading={<GoBackButton onPress={goBackToSettings} />}
                testID={AiFeaturesPageSelector.Container}
            >
                <View className="gap-y-7xl pb-5xl">
                    {isAiBuildEnabled ? (
                        <AiSettingsSection />
                    ) : (
                        <GroupedListSection>
                            <GroupedListRow
                                title={t`On-device AI isn't available in this version`}
                                subtitle={t`Categories still work with on-device rules.`}
                            />
                        </GroupedListSection>
                    )}
                    <AiModelStorage />
                    <MenuSpacer />
                </View>
            </CollapsibleChromePage>
        </GroupedSurface>
    );
}
