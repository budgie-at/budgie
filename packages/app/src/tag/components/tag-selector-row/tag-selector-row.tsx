import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';

interface Props {
    readonly tag: Pick<TagEntityInterface, 'id' | 'title'>;
    readonly isSelected: boolean;
    readonly isPrimary: boolean;
    readonly onSelect: (id: number) => void;
    readonly onPrimarySelect?: (id: number) => void;
}

export const TagSelectorRow = ({ tag, isSelected, isPrimary, onSelect, onPrimarySelect }: Props) => {
    const { t } = useLingui();
    const { title } = tag;
    const handleSelect = () => void onSelect(tag.id);
    const handlePrimarySelect = () => void onPrimarySelect?.(tag.id);
    const subtitle = isPrimary ? t`Primary` : void 0;
    const pressableProps = {
        ...(isDefined(onPrimarySelect) && { onLongPress: handlePrimarySelect }),
        accessibilityLabel: isPrimary ? t`${title}, primary` : tag.title,
        accessibilityActions: isDefined(onPrimarySelect) && !isPrimary ? [{ name: 'makePrimary', label: t`Make primary` }] : [],
        onAccessibilityAction: handlePrimarySelect
    };

    return (
        <SelectorRow
            title={tag.title}
            subtitle={subtitle}
            isSelected={isSelected}
            onPress={handleSelect}
            pressableProps={pressableProps}
            testID={TagsSelectorModalSelector.Card(tag.title)}
            left={<Icon icon={UserIconNameEnum.Tag} size={22} className="text-secondary-foreground" />}
        />
    );
};
