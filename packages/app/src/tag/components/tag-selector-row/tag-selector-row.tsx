import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
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
    const primaryContent = (
        <View className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Star} size={14} className="text-positive-action" />
            <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                <Trans>Primary</Trans>
            </Text>
        </View>
    );
    const primaryAction =
        isSelected && !isPrimary && isDefined(onPrimarySelect) ? (
            <HapticPressable
                onPress={handlePrimarySelect}
                accessibilityRole="button"
                accessibilityLabel={t`Make primary`}
                className="min-h-[44px] justify-center pl-[64px] pr-xl pb-sm"
            >
                <Text className="text-[13px] font-semibold text-positive-action" maxFontSizeMultiplier={1.6}>
                    <Trans>Make primary</Trans>
                </Text>
            </HapticPressable>
        ) : null;
    const subtitle = isPrimary ? primaryContent : void 0;
    const pressableProps = {
        accessibilityLabel: isPrimary ? t`${title}, primary` : tag.title,
        accessibilityActions: isDefined(onPrimarySelect) && !isPrimary ? [{ name: 'makePrimary', label: t`Make primary` }] : [],
        onAccessibilityAction: handlePrimarySelect
    };

    return (
        <View>
            <SelectorRow
                title={tag.title}
                subtitle={subtitle}
                isSelected={isSelected}
                onPress={handleSelect}
                pressableProps={pressableProps}
                testID={TagsSelectorModalSelector.Card(tag.title)}
                left={<Icon icon={UserIconNameEnum.Tag} size={22} className="text-secondary-foreground" />}
            />
            {primaryAction}
        </View>
    );
};
