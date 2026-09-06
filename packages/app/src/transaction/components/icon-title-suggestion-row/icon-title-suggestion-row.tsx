import { SuggestionStatus } from '@budgie/ai';
import { UserIconNameEnum } from '@budgie/contracts';

import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

interface Props<T> {
    readonly suggestions: T[];
    readonly status: SuggestionStatus;
    readonly enabled: boolean;
    readonly onSelect: (item: T) => void;
    readonly getKey: (item: T) => string | number;
    readonly getIcon: (item: T) => UserIconNameEnum;
    readonly getTitle: (item: T) => string;
    readonly testIDPrefix: string;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const IconTitleSuggestionRow = <T,>(props: Props<T>) => {
    const { suggestions, status, enabled, onSelect, getKey, getIcon, getTitle, testIDPrefix } = props;

    const renderPill = (item: T, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={getKey(item)}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
            {...testIDProps(testIDPrefix, index)}
        >
            <SuggestionPillContent icon={getIcon(item)} title={getTitle(item)} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={suggestions} status={status} enabled={enabled} renderPill={renderPill} onSelect={onSelect} />;
};
