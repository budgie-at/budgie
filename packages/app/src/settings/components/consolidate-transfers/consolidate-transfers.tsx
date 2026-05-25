import { UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { transferConsolidationService } from '../../../sync/service/transfer-consolidation.service';
import { SettingsCard } from '../settings-card/settings-card';

const logger = getLogger('ConsolidateTransfers');

export const ConsolidateTransfers = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    // eslint-disable-next-line max-statements -- Action handler runs preview, confirm, execute, and toast feedback in sequence
    const handleConsolidate = async () => {
        const startedAt = Date.now();

        logger.log('press');
        setIsLoading(true);
        try {
            logger.log('preview:start');
            const { autoCandidateCount, manualReviewCandidateCount } = await transferConsolidationService.preview();
            logger.log('preview:done', {
                autoCandidateCount,
                manualReviewCandidateCount,
                durationMs: Date.now() - startedAt
            });
            const autoCandidateText = t({
                message: plural(autoCandidateCount, {
                    one: '# high-confidence match',
                    other: '# high-confidence matches'
                })
            });
            const manualReviewCandidateText = t({
                message: plural(manualReviewCandidateCount, {
                    one: '# review match',
                    other: '# review matches'
                })
            });

            const confirmed = await confirmAlert({
                title: t`Consolidate Matches`,
                message: t`This will merge ${autoCandidateText}. ${manualReviewCandidateText} will be kept for review.`,
                confirmText: t`Consolidate`,
                cancelText: t`Cancel`
            });

            if (!confirmed) {
                logger.log('confirm:result', { confirmed: false });

                return;
            }

            logger.log('confirm:result', { confirmed: true });
            const consolidateStartedAt = Date.now();
            const { consolidated, found } = await transferConsolidationService.consolidate();
            logger.log('consolidated', { found, consolidated, durationMs: Date.now() - consolidateStartedAt });
            const foundPairsText = t({
                message: plural(found, {
                    one: '# high-confidence match',
                    other: '# high-confidence matches'
                })
            });

            Toast.show({
                type: 'success',
                text1: t`Matches consolidated`,
                text2: t`Merged ${consolidated} of ${foundPairsText}.`
            });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            logger.error('failed', { errorMessage });
            Toast.show({ type: 'error', text1: t`Could not consolidate matches`, text2: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            onPress={handleConsolidate}
            title={t`Consolidate Matches`}
            description={t`Merge matching transfers and refunds`}
            icon={UserIconNameEnum.ArrowLeftRight}
            variant="positive"
            isLoading={isLoading}
            testID={SettingsPageSelector.ConsolidateTransfersCard}
        />
    );
};
