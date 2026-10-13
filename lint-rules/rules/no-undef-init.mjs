export default {
    meta: {
        type: 'suggestion',
        docs: { description: 'Disallow initializing variables to undefined.' },
        schema: [],
        messages: { noUndefInit: 'Do not initialize a variable to undefined.' }
    },
    create(context) {
        return {
            VariableDeclarator(node) {
                const { init, id, parent } = node;

                if (init !== null && init.type === 'Identifier' && init.name === 'undefined' && id.type === 'Identifier' && parent.kind !== 'const') {
                    context.report({ node, messageId: 'noUndefInit' });
                }
            }
        };
    }
};
