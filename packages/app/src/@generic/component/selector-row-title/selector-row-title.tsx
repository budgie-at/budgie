import { Text } from 'react-native';

import { cn } from '../../utils/cn.util';
import { splitHighlight } from '../../utils/split-highlight.util';

interface Props {
    readonly text: string;
    readonly highlight?: string;
    readonly language?: string;
    readonly testID?: string;
    readonly isSelected?: boolean;
}

export const SelectorRowTitle = ({ text, highlight = '', language, testID, isSelected = false }: Props) => {
    const [beforeMatch, match, afterMatch] = splitHighlight(text, highlight);

    return (
        <Text
            className={cn('text-primary text-[17px]', isSelected && 'font-semibold')}
            numberOfLines={1}
            testID={testID}
            accessibilityLanguage={language}
        >
            {beforeMatch}
            <Text className="font-semibold">{match}</Text>
            {afterMatch}
        </Text>
    );
};
