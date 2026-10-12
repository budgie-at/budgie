import { SuggestionStatus } from '@budgie/ai';

import { isNotEmptyArray } from '@rnw-community/shared';

import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionRowLayout } from '../suggestion-row-layout/suggestion-row-layout';

import type { IconTitleSuggestionItemInterface } from '../../interface/icon-title-suggestion-item.interface';

interface Props {
    readonly items: readonly IconTitleSuggestionItemInterface[];
    readonly status: SuggestionStatus;
    readonly enabled: boolean;
    readonly testIDPrefix: string;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const IconTitleSuggestionRow = ({ items, status, enabled, testIDPrefix }: Props) => {
    const { showLoading, showContent, isProcessing } = useSuggestionLoadingState({
        status,
        hasResults: isNotEmptyArray(items),
        enabled
    });

    return (
        <SuggestionRowLayout showContent={showContent} showLoading={showLoading} isProcessing={isProcessing}>
            {[...items].reverse().map((item, index) => (
                <SuggestionPill
                    key={item.key}
                    index={index}
                    animationDuration={ANIMATION_DURATION}
                    staggerDelay={STAGGER_DELAY}
                    onPress={item.onSelect}
                    {...testIDProps(testIDPrefix, index)}
                >
                    <SuggestionPillContent icon={item.icon} title={item.title} />
                </SuggestionPill>
            ))}
        </SuggestionRowLayout>
    );
};
