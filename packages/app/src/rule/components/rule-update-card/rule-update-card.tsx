import { RuleService } from '@budgie/rules';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
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

    const updateRule = Effect.gen(function* () {
        const ruleService = yield* RuleService;
        const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;

        yield* ruleService.applySuggestedActions(updateRuleData.ruleId, updateRuleData.categoryId, updateRuleData.tagIds);
        yield* Effect.forkDetach(ruleApplicationDrainerService.enqueueRuleApplication(updateRuleData.ruleId, showRuleApplicationToast));
    });

    const handleYes = (): Promise<void> => appRuntime.runPromise(updateRule);

    return (
        <SwipeableRuleCard
            descriptionText={t`Update rule?`}
            successMessage={<Trans>Rule updated</Trans>}
            errorMessage={<Trans>Could not update rule</Trans>}
            layout="wide"
            onYes={handleYes}
            onComplete={onRuleUpdated}
            onDismiss={onDismiss}
        />
    );
};
