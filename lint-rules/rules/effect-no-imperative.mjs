export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow try, throw and new Promise where effectful code must use Effect.' },
        schema: [],
        messages: { useEffect: 'Use Effect (see AGENTS.md ## Effect)' }
    },
    create(context) {
        const report = node => context.report({ node, messageId: 'useEffect' });

        return {
            TryStatement: report,
            ThrowStatement: report,
            NewExpression(node) {
                if (node.callee.type === 'Identifier' && node.callee.name === 'Promise') {
                    report(node);
                }
            }
        };
    }
};
