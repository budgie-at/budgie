import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly isCreating: boolean;
    readonly close: EmptyFn;
    readonly handleCreateRule: EmptyFn;
    readonly hasSelectedFields: boolean;
    readonly handleConfigureRule: EmptyFn;
}

export const SuggestRuleBottomSheetFooter = ({ isCreating, close, handleConfigureRule, handleCreateRule, hasSelectedFields }: Props) => {
    const { t } = useLingui();
    const isSubmitDisabled = isCreating || !hasSelectedFields;

    return (
        <View className="gap-y-md mt-3xl">
            <Button
                content={t`Create Rule`}
                onPress={handleCreateRule}
                variant="ghost"
                size="md"
                leftIcon={UserIconNameEnum.Sparkles}
                disabled={isSubmitDisabled}
                testID={SuggestRuleSelectors.CreateRuleButton}
            />
            <Button
                content={t`Configure Rule`}
                onPress={handleConfigureRule}
                variant="secondary"
                size="md"
                leftIcon={UserIconNameEnum.Settings}
                disabled={isSubmitDisabled}
                testID={SuggestRuleSelectors.ConfigureRuleButton}
            />
            <Button
                content={t`No thanks`}
                onPress={close}
                variant="secondary"
                size="md"
                disabled={isCreating}
                testID={SuggestRuleSelectors.NoThanksButton}
            />
        </View>
    );
};
