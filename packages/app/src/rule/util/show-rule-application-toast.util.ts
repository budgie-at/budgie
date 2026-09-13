import { plural, t } from '@lingui/core/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import type { ApplyRuleResultInterface } from '../interface/apply-rule-result.interface';

export const showRuleApplicationToast = (result: ApplyRuleResultInterface | null, error: unknown): void => {
    if (!isDefined(result)) {
        showErrorToast(t`Could not apply rule to existing transactions`, getErrorMessage(error));

        return;
    }

    const { applied, failed, total } = result;

    if (total === 0) {
        Toast.show({
            type: 'info',
            text1: t`No transactions matched`,
            text2: t`The rule was saved but no existing transactions needed updating.`
        });

        return;
    }

    if (failed > 0) {
        Toast.show({
            type: 'error',
            text1: t`Rule partially applied`,
            text2: t`Updated ${applied} of ${total} transactions.`
        });

        return;
    }

    Toast.show({
        type: 'success',
        text1: t`Rule applied`,
        text2: plural(applied, {
            one: '# matching transaction updated',
            other: '# matching transactions updated'
        })
    });
};
