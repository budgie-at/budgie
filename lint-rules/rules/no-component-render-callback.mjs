export default {
    meta: {
        type: 'problem',
        docs: { description: 'Require JSX wrappers when passing components to render callbacks.' },
        schema: [],
        messages: {
            componentRenderCallback:
                'Render callbacks are called as plain functions; passing a component can cause an invalid hook call with React Compiler. Wrap it in a callback that renders JSX, for example: ({ section }) => <X section={section} />.'
        }
    },
    create(context) {
        return {
            JSXAttribute(node) {
                if (node.name.type !== 'JSXIdentifier' || !node.name.name.startsWith('render') || node.value?.type !== 'JSXExpressionContainer') {
                    return;
                }

                const expression = node.value.expression;
                const componentName = expression.type === 'Identifier'
                    ? expression.name
                    : expression.type === 'MemberExpression' && !expression.computed && expression.property.type === 'Identifier'
                        ? expression.property.name
                        : '';

                if (/^[A-Z]/u.test(componentName)) {
                    context.report({ node: expression, messageId: 'componentRenderCallback' });
                }
            }
        };
    }
};
