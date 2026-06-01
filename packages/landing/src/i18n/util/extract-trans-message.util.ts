import { Children, isValidElement } from 'react';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import type { TransMessagePropsInterface } from '../interface/trans-message-props.interface';
import type { I18n } from '@lingui/core';
import type { ReactNode } from 'react';

export const extractTransMessage = (node: ReactNode, i18n: I18n): string => {
    const children = Children.toArray(node);

    if (isEmptyArray(children)) {
        return '';
    }

    if (children.length === 1) {
        const [child] = children;

        if (typeof child === 'string') {
            return child;
        }

        if (isValidElement<TransMessagePropsInterface>(child)) {
            const { id, message } = child.props;

            if (isDefined(id)) {
                return i18n._(id, {}, { message });
            }

            return extractTransMessage(child.props.children, i18n);
        }
    }

    return children.map(child => (typeof child === 'string' ? child : extractTransMessage(child, i18n))).join('');
};
