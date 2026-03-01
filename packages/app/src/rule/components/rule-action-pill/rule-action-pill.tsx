import { RuleActionTypeEnum, RuleActionWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { RuleActionPillContainer } from '../rule-action-pill-container/rule-action-pill-container';

interface Props {
    readonly action: RuleActionWithRelationsEntityInterface;
}

export const RuleActionPill = ({ action }: Props) => {
    const { type, category, tag } = action;

    if (type === RuleActionTypeEnum.SET_CATEGORY && isDefined(category)) {
        const categoryTitle = category.title;

        return (
            <RuleActionPillContainer icon={UserIconNameEnum.FolderOpen}>
                <Trans>Category → {categoryTitle}</Trans>
            </RuleActionPillContainer>
        );
    }

    if (type === RuleActionTypeEnum.ADD_TAG && isDefined(tag)) {
        const tagTitle = tag.title;

        return (
            <RuleActionPillContainer icon={UserIconNameEnum.Tag}>
                <Trans>Tag → {tagTitle}</Trans>
            </RuleActionPillContainer>
        );
    }

    if (type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
        return (
            <RuleActionPillContainer icon={UserIconNameEnum.ArrowRightLeft}>
                <Trans>Transfer</Trans>
            </RuleActionPillContainer>
        );
    }

    return null;
};
