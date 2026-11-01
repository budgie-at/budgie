import { Text } from 'react-native';

import { splitHighlight } from '../../utils/split-highlight.util';

interface Props {
    readonly text: string;
    readonly highlight?: string;
    readonly language?: string;
    readonly testID?: string;
}

export const SelectorRowTitle = ({ text, highlight = '', language, testID }: Props) => {
    const [beforeMatch, match, afterMatch] = splitHighlight(text, highlight);

    return (
        <Text className="text-primary text-[17px]" numberOfLines={1} testID={testID} accessibilityLanguage={language}>
            {beforeMatch}
            <Text className="font-semibold">{match}</Text>
            {afterMatch}
        </Text>
    );
};
