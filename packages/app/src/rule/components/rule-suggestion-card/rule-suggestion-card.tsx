import { RuleService, SuggestRuleDataInterface } from '@budgie/rules';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Alert } from 'react-native';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { RuleApplicationDrainerService } from '../../service/rule-application-drainer.service';
import { showRuleApplicationToast } from '../../utils/show-rule-application-toast.util';
import { SwipeableRuleCard } from '../swipeable-rule-card/swipeable-rule-card';

import { RuleSuggestionCardSelector } from './rule-suggestion-card.selector';

interface Props {
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
    readonly onCreatingChange?: (next: boolean) => void;
}

export const RuleSuggestionCard = (props: Props) => {
    const { suggestRuleData, onRuleCreated, onDismiss, onCreatingChange } = props;
    const [openRuleForm] = useRuleFormModal();

    const confirmDuplicate = (ruleId: number) =>
        Effect.callback<void>(resume => {
            Alert.alert(t`Duplicate rule`, t`A rule with the same conditions already exists.`, [
                {
                    text: t`Cancel`,
                    style: 'cancel',
                    onPress: () => {
                        resume(Effect.interrupt);
                    }
                },
                {
                    text: t`Edit existing`,
                    onPress: () => {
                        openRuleForm({ ruleId });
                        resume(Effect.interrupt);
                    }
                },
                {
                    text: t`Create anyway`,
                    onPress: () => {
                        resume(Effect.void);
                    }
                }
            ]);
        });

    const createRule = Effect.gen(function* () {
        const ruleService = yield* RuleService;
        const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
        const rule = yield* ruleService
            .createFromSuggestion(suggestRuleData)
            .pipe(
                Effect.catchTag('RuleSuggestionDuplicateError', error =>
                    Effect.andThen(confirmDuplicate(error.ruleId), ruleService.createFromSuggestionAllowingDuplicate(suggestRuleData))
                )
            );

        yield* Effect.forkDetach(ruleApplicationDrainerService.enqueueRuleApplication(rule.id, showRuleApplicationToast));
    });

    const handleYes = (): Promise<void> => {
        onCreatingChange?.(true);

        return appRuntime.runPromise(createRule);
    };

    return (
        <SwipeableRuleCard
            descriptionText={t`Quick rule`}
            successMessage={<Trans>Rule created</Trans>}
            errorMessage={<Trans>Could not create rule</Trans>}
            cardTestID={RuleSuggestionCardSelector.Card}
            buttonTestID={RuleSuggestionCardSelector.CreateRuleButton}
            layout="wide"
            onYes={handleYes}
            onComplete={onRuleCreated}
            onDismiss={onDismiss}
        />
    );
};
