import { RuleActionTypeEnum, RuleActionWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { RuleActionPillContainer } from '../rule-action-pill-container/rule-action-pill-container';

interface Props {
    readonly action: RuleActionWithRelationsEntityInterface;
    readonly testID?: string;
}

export const RuleActionPill = ({ action, testID }: Props) => {
    const { type, category, tag, account } = action;

    if (type === RuleActionTypeEnum.SET_CATEGORY && isDefined(category)) {
        const categoryTitle = category.title;

        return (
            <RuleActionPillContainer icon={UserIconNameEnum.FolderOpen} testID={testID}>
                <Trans>Category → {categoryTitle}</Trans>
            </RuleActionPillContainer>
        );
    }

    if (type === RuleActionTypeEnum.ADD_TAG && isDefined(tag)) {
        const tagTitle = tag.title;

        return (
            <RuleActionPillContainer icon={UserIconNameEnum.Tag} testID={testID}>
                <Trans>Tag → {tagTitle}</Trans>
            </RuleActionPillContainer>
        );
    }

    if (type === RuleActionTypeEnum.CONVERT_TO_TRANSFER && isDefined(account)) {
        const accountTitle = account.title;

        return (
            <RuleActionPillContainer icon={UserIconNameEnum.ArrowRightLeft} testID={testID}>
                <Trans>Transfer → {accountTitle}</Trans>
            </RuleActionPillContainer>
        );
    }

    return null;
};
