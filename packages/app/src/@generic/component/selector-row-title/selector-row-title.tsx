import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { splitHighlight } from '../../utils/split-highlight.util';

interface Props {
    readonly text: string;
    readonly highlight?: string;
    readonly language?: string;
    readonly testID?: string;
    readonly isSelected?: boolean;
}

const titleVariants = cva('text-primary text-[17px]', { variants: { isSelected: { true: 'font-semibold', false: '' } } });

export const SelectorRowTitle = ({ text, highlight = '', language, testID, isSelected = false }: Props) => {
    const [beforeMatch, match, afterMatch] = splitHighlight(text, highlight);

    return (
        <Text className={titleVariants({ isSelected })} numberOfLines={1} testID={testID} accessibilityLanguage={language}>
            {beforeMatch}
            <Text className="font-semibold">{match}</Text>
            {afterMatch}
        </Text>
    );
};
