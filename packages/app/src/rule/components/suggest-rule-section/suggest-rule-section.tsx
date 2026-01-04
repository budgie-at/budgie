import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly onPress: EmptyFn;
}

export const SuggestRuleSection = ({ onPress }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row items-center justify-between py-xl">
            <Text className="text-sm text-secondary-foreground">
                <Trans>Create automation rule?</Trans>
            </Text>

            <Button content={t`Add Rule`} onPress={onPress} variant="ghost" size="sm" leftIcon={UserIconNameEnum.Sparkles} />
        </View>
    );
};
