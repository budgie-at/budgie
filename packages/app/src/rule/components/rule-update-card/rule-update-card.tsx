import { RuleService } from '@budgie/rules';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useBottomChromeInset } from '@rnw-community/react-native-screen-chrome';

import { UpdateRuleDataInterface } from '../../interface/update-rule-data.interface';
import { RuleApplicationDrainerService } from '../../service/rule-application-drainer.service';
import { showRuleApplicationToast } from '../../utils/show-rule-application-toast.util';
import { SwipeableRuleCard } from '../swipeable-rule-card/swipeable-rule-card';

interface Props {
    readonly updateRuleData: UpdateRuleDataInterface;
    readonly onRuleUpdated: () => void;
    readonly onDismiss: () => void;
}

export const RuleUpdateCard = (props: Props) => {
    const { updateRuleData, onRuleUpdated, onDismiss } = props;
    const { inset } = useBottomChromeInset();

    const updateRule = Effect.gen(function* () {
        const ruleService = yield* RuleService;
        const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;

        yield* ruleService.applySuggestedActions(updateRuleData.ruleId, updateRuleData.categoryId, updateRuleData.tagIds);
        yield* Effect.forkDetach(
            ruleApplicationDrainerService.enqueueRuleApplication(
                updateRuleData.ruleId,
                (result, error) => void showRuleApplicationToast(result, error, inset)
            )
        );

        return true;
    });

    return (
        <SwipeableRuleCard
            descriptionText={t`Update rule?`}
            successMessage={<Trans>Rule updated</Trans>}
            errorMessage={<Trans>Could not update rule</Trans>}
            onYes={updateRule}
            onComplete={onRuleUpdated}
            onDismiss={onDismiss}
        />
    );
};
