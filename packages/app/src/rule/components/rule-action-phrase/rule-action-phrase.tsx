import { RuleActionTypeEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';

import type { RuleCreateInputInterface } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

interface Props {
    readonly action: RuleCreateInputInterface['actions'][number];
}

const TARGET_MARKER = '\u2063';

const EMPTY_TARGET: Record<RuleActionTypeEnum, MessageDescriptor> = {
    [RuleActionTypeEnum.SET_CATEGORY]: msg`a category`,
    [RuleActionTypeEnum.ADD_TAG]: msg`(pick one)`,
    [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: msg`an account`
};

export const RuleActionPhrase = ({ action }: Props) => {
    const { t } = useLingui();
    const { category } = useGetCategoryByIdQuery(action.type === RuleActionTypeEnum.SET_CATEGORY ? (action.categoryId ?? 0) : 0);
    const { tags } = useGetTagByIdsQuery(action.type === RuleActionTypeEnum.ADD_TAG && isDefined(action.tagId) ? [action.tagId] : []);
    const { account } = useGetAccountByIdQuery(action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER ? (action.accountId ?? 0) : 0);
    const tagTitle = tags?.at(0)?.title;
    const targets: Record<RuleActionTypeEnum, string | null> = {
        [RuleActionTypeEnum.SET_CATEGORY]: category?.title ?? null,
        [RuleActionTypeEnum.ADD_TAG]: isDefined(tagTitle) ? `#${tagTitle}` : null,
        [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: account?.title ?? null
    };

    const target = TARGET_MARKER;
    const templates: Record<RuleActionTypeEnum, string> = {
        [RuleActionTypeEnum.SET_CATEGORY]: t`move to ${target}`,
        [RuleActionTypeEnum.ADD_TAG]: t`add tag ${target}`,
        [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: t`transfer to ${target}`
    };
    const [before = '', after = ''] = templates[action.type].split(TARGET_MARKER);
    const targetLabel = targets[action.type];
    const targetClassName = isDefined(targetLabel) ? 'text-primary' : 'text-secondary-foreground';

    return (
        <>
            <Text className="text-primary">{before}</Text>
            <Text className={targetClassName}>{targetLabel ?? t(EMPTY_TARGET[action.type])}</Text>
            <Text className="text-primary">{after}</Text>
        </>
    );
};
