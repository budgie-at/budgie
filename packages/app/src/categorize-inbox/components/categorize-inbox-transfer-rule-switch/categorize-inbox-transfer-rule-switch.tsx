import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { getCategorizeInboxJarName } from '../../utils/get-categorize-inbox-jar-name.util';
import { CategorizeInboxTransferScreenSelector } from '../categorize-inbox-transfer-screen/categorize-inbox-transfer-screen.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly value: boolean;
    readonly onValueChange: (value: boolean) => void;
}

export const CategorizeInboxTransferRuleSwitch = ({ cluster, value, onValueChange }: Props) => {
    const { t } = useLingui();

    const jarName = getCategorizeInboxJarName(cluster.displayTitle);
    const { displayTitle } = cluster;
    const label = isDefined(jarName) ? t`Also for new «${jarName}» payments` : t`Also for new “${displayTitle}” payments`;

    return (
        <View className="bg-secondary-background flex-row items-center gap-x-xl rounded-3xl p-xl">
            <View className="flex-1 gap-y-xxs">
                <Text className="text-primary text-md font-semibold">{label}</Text>
                <Text className="text-secondary-foreground text-xs">{t`Saved as a rule`}</Text>
            </View>
            <ThemedSwitch
                value={value}
                onValueChange={onValueChange}
                accessibilityLabel={label}
                testID={CategorizeInboxTransferScreenSelector.RuleSwitch}
            />
        </View>
    );
};
