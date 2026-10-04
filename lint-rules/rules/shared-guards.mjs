const isNullLiteral = node => node.type === 'Literal' && node.raw === 'null';

const isUndefinedIdentifier = node => node.type === 'Identifier' && node.name === 'undefined';

const isLengthAccess = node => node.type === 'MemberExpression' && node.property.name === 'length';

const isLiteralValue = (node, value) => node.type === 'Literal' && node.value === value;

const getMessageId = ({ operator, left, right }) => {
    if (operator === '===' && isNullLiteral(right)) {
        return 'strictEqualsNull';
    }

    if (operator === '===' && isUndefinedIdentifier(right)) {
        return 'strictEqualsUndefined';
    }

    if (operator === '!==' && (isNullLiteral(right) || isUndefinedIdentifier(right))) {
        return 'notEqualsNullish';
    }

    if (operator === '===' && isLengthAccess(left) && isLiteralValue(right, 0)) {
        return 'emptyLength';
    }

    if (operator === '>' && isLengthAccess(left) && isLiteralValue(right, 0)) {
        return 'notEmptyLength';
    }

    if (operator === '===' && isLiteralValue(right, '')) {
        return 'emptyString';
    }

    return null;
};

export default {
    meta: {
        type: 'suggestion',
        docs: { description: 'Require @rnw-community/shared guards instead of manual nullish, length and empty-string checks.' },
        schema: [],
        messages: {
            strictEqualsNull: 'Use !isDefined(x) from @rnw-community/shared (CLAUDE.md Canonical Mapping).',
            strictEqualsUndefined: 'Use !isDefined(x) from @rnw-community/shared.',
            notEqualsNullish: 'Use isDefined(x) from @rnw-community/shared.',
            emptyLength: 'Use isEmptyArray(x) for arrays or !isNotEmptyString(x) for strings from @rnw-community/shared.',
            notEmptyLength: 'Use isNotEmptyArray(x) or isNotEmptyString(x) from @rnw-community/shared.',
            emptyString: 'Use !isNotEmptyString(x) from @rnw-community/shared (isEmptyString narrows the else branch to never).'
        }
    },
    create(context) {
        return {
            BinaryExpression(node) {
                const messageId = getMessageId(node);

                if (messageId !== null) {
                    context.report({ node, messageId });
                }
            }
        };
    }
};
