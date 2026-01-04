import { RuleEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { ruleService } from '../../service/rule.service';

interface Props {
    readonly rule: RuleEntityInterface;
    readonly onOpen: (rule: RuleEntityInterface) => void;
}

const iconParams = { variant: 'dark-warning', size: 40, iconSize: 20 } as const;

export const RuleCard = ({ onOpen, rule }: Props) => {
    const { t } = useLingui();
    const {priority} = rule;
    const handleOpen = () => void onOpen(rule);

    const handleToggle = async (enabled: boolean) => {
        await ruleService.setEnabled(rule.id, enabled);
    };

    return (
        <SimpleHorizontalCell
            right={
                <View className="flex-row items-center gap-x-lg">
                    <Text className="text-secondary-foreground font-medium text-xs">
                        <Trans>Swipe left</Trans>
                    </Text>
                    <ThemedSwitch value={rule.enabled} onValueChange={handleToggle} />
                </View>
            }
            onPress={handleOpen}
            iconParams={iconParams}
            title={rule.title}
            description={t`Priority: ${priority}`}
            icon={UserIconNameEnum.Sparkles}
        />
    );
};
