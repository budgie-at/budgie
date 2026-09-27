import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
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

    const { data: tagEvidence } = useDatabaseLiveQuery(transactionCategorizeInboxRepository.findTagEvidence());

    const tagContext = categorizeInboxEngineService.buildContext(tagEvidence, defaultInstrument.id);

    const handleApply = async (assignment: CategorizeInboxAssignmentInterface): Promise<boolean> => {
        const tagIds = await openTagsSelector({ initialTagIds: assignment.followUpLabelIds, description: assignment.displayTitle });

        if (!isNotEmptyArray(tagIds)) {
            return false;
        }

        await categorizeInboxService.assign(
            CategorizeInboxLabelKindEnum.TAG,
            tagIds.map(tagId => ({ ...assignment, labelId: tagId }))
        );

        return true;
    };

    return {
        title: t`+ Tags`,
        accessibilityLabel: t`Add tags to these transactions`,
        suggestLabelIds: rows => categorizeInboxEngineService.suggestLabelIds(rows, tagContext),
        apply: handleApply
    };
};
