import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { AiModelStorageCard } from '../../../ai/component/ai-model-storage-card/ai-model-storage-card';

import { AiModelsPageSelector } from './ai-models-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function AiModelsPage() {
    const { t } = useLingui();

    return (
        <CollapsibleChromePage
            title={t`AI features`}
            subtitle={t`Choose what you use and clear downloads you no longer need`}
            leading={<GoBackButton onPress={handleGoBack} />}
            testID={AiModelsPageSelector.Container}
        >
            <View className="gap-y-lg pb-5xl">
                <AiModelStorageCard />
                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}
