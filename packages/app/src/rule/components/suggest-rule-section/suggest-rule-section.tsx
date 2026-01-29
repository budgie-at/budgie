import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly onPress: () => void;
}

export const SuggestRuleSection = ({ onPress }: Props) => (
    <View testID={SuggestRuleSelectors.Section} className="mx-3xl mb-3xl gap-y-lg">
        <Text className="text-secondary-foreground text-sm">
            <Trans>Create automation rule?</Trans>
        </Text>
        <Button
            testID={SuggestRuleSelectors.AddRuleButton}
            content={<Trans>Add Rule</Trans>}
            variant="ghost"
            size="sm"
            leftIcon={UserIconNameEnum.Sparkles}
            onPress={onPress}
        />
    </View>
);
