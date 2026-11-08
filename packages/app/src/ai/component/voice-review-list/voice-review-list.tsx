import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { VoiceReviewEmptyState } from '../voice-review-empty-state/voice-review-empty-state';
import { VoiceReviewItem } from '../voice-review-item/voice-review-item';
import { VoiceReviewTranscript } from '../voice-review-transcript/voice-review-transcript';

import type { UseVoiceReviewReturnInterface } from '../../interface/use-voice-review-return.interface';

const SCROLL_CONTENT_STYLE = { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, flexGrow: 1 } as const;

interface Props {
    readonly review: UseVoiceReviewReturnInterface;
    readonly currencySymbol: string;
    readonly originalText: string;
    readonly onCategoryPress: (rowId: string, categoryId: number | null) => void;
}

export const VoiceReviewList = (props: Props) => {
    const { review, currencySymbol, originalText, onCategoryPress } = props;
    const { rows, isSaving, editAmount, deleteRow } = review;

    if (isEmptyArray(rows)) {
        return (
            <VoiceReviewEmptyState>
                <VoiceReviewTranscript text={originalText} />
            </VoiceReviewEmptyState>
        );
    }

    const canDelete = rows.length > 1;

    return (
        <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={SCROLL_CONTENT_STYLE}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bottomOffset={24}
        >
            <GroupedListSection>
                {rows.map((row, index) => (
                    <VoiceReviewItem
                        key={row.id}
                        row={row}
                        index={index}
                        currencySymbol={currencySymbol}
                        canDelete={canDelete}
                        disabled={isSaving}
                        onAmountChange={editAmount}
                        onCategoryPress={onCategoryPress}
                        onDelete={deleteRow}
                    />
                ))}
            </GroupedListSection>
            <VoiceReviewTranscript text={originalText} />
        </KeyboardAwareScrollView>
    );
};
