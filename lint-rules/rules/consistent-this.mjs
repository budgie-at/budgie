const ALIAS = 'that';

export default {
    meta: {
        type: 'suggestion',
        docs: { description: `Require "this" to be aliased only as "${ALIAS}".` },
        schema: [],
        messages: {
            wrongAlias: 'Designated alias for "this" is "' + ALIAS + '".',
            wrongTarget: '"' + ALIAS + '" may only be assigned "this".'
        }
    },
    create(context) {
        return {
            VariableDeclarator(node) {
                if (node.id.type !== 'Identifier') {
                    return;
                }

                const isThis = node.init !== null && node.init.type === 'ThisExpression';

                if (isThis && node.id.name !== ALIAS) {
                    context.report({ node, messageId: 'wrongAlias' });
                }

                if (!isThis && node.id.name === ALIAS && node.init !== null) {
                    context.report({ node, messageId: 'wrongTarget' });
                }
            }
        };
    }
};
