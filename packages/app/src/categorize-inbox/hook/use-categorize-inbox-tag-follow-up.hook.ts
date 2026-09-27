import { useLingui } from '@lingui/react/macro';

import { transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useTagsSelectorModal } from '../../tag/context/tags-selector-modal.context';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import { categorizeInboxEngineService } from '../service/categorize-inbox-engine.service';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxFollowUpInterface } from '../interface/categorize-inbox-follow-up.interface';

export const useCategorizeInboxTagFollowUp = (): CategorizeInboxFollowUpInterface => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const [openTagsSelector] = useTagsSelectorModal();

    const handlePickLabelIds = async (assignment: CategorizeInboxAssignmentInterface): Promise<number[] | null> => {
        const tagContext = categorizeInboxEngineService.buildContext(
            await transactionCategorizeInboxRepository.findTagEvidence(),
            defaultInstrument.id
        );

        return openTagsSelector({
            initialTagIds: categorizeInboxEngineService.suggestLabelIds(assignment.rows, tagContext),
            description: assignment.displayTitle
        });
    };

    return {
        title: t`+ Tags`,
        accessibilityLabel: t`Add tags to these transactions`,
        writeFailed: t`Could not tag transactions`,
        pickLabelIds: handlePickLabelIds,
        assignMany: assignments => categorizeInboxService.assign(CategorizeInboxLabelKindEnum.TAG, assignments),
        undo: assignments => categorizeInboxService.undo(CategorizeInboxLabelKindEnum.TAG, assignments)
    };
};
