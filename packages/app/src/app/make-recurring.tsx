import { useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { parsePositiveRouteParam } from '../@generic/utils/parse-positive-route-param.util';
import { showActionToast } from '../@generic/utils/show-action-toast/show-action-toast';
import { MakeRecurringSheet } from '../recurring/components/make-recurring-sheet/make-recurring-sheet';
import { MakeRecurringResultKindEnum } from '../recurring/enum/make-recurring-result-kind.enum';

import type { MakeRecurringResultType } from '../recurring/interface/make-recurring-result.type';

export default function MakeRecurringScreen() {
    const { t } = useLingui();
    const { transactionId } = useLocalSearchParams<{ transactionId?: string | string[] }>();
    const parsedTransactionId = parsePositiveRouteParam(transactionId);

    const handleResolved = (result: MakeRecurringResultType) => {
        if (result.kind === MakeRecurringResultKindEnum.CREATE) {
            void router.replace({ pathname: '/recurring/create', params: { transactionId: String(parsedTransactionId) } });

            return;
        }

        const { seriesTitle: title } = result;

        void router.back();
        showActionToast(t`Added to ${title}`, {
            label: t`View`,
            onPress: () => void router.push({ pathname: '/recurring/[id]', params: { id: String(result.seriesId) } })
        });
    };

    const { handleCommit, handleDismissed } = useMorphingSheetResult<MakeRecurringResultType>(handleResolved);

    if (!isDefined(parsedTransactionId)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <MakeRecurringSheet transactionId={parsedTransactionId} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
