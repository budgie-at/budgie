export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow RegistryContext.Provider outside the single root layout that hosts it.' },
        schema: [],
        messages: { noProvider: 'RegistryContext.Provider belongs only in the root layout; read atoms through hooks instead.' }
    },
    create(context) {
        return {
            JSXMemberExpression(node) {
                if (node.object.type === 'JSXIdentifier' && node.object.name === 'RegistryContext' && node.property.name === 'Provider') {
                    context.report({ node, messageId: 'noProvider' });
                }
            }
        };
    }
};
