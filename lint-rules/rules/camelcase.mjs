const isUnderscored = name => {
    const trimmedName = name.replace(/^_+|_+$/gu, '');

    return trimmedName.includes('_') && trimmedName !== trimmedName.toLocaleUpperCase();
};

const collectBindingIdentifiers = pattern => {
    switch (pattern?.type) {
        case 'Identifier':
            return [pattern];
        case 'ObjectPattern':
            return pattern.properties.flatMap(property =>
                collectBindingIdentifiers(property.type === 'RestElement' ? property.argument : property.value)
            );
        case 'ArrayPattern':
            return pattern.elements.flatMap(collectBindingIdentifiers);
        case 'AssignmentPattern':
            return collectBindingIdentifiers(pattern.left);
        case 'RestElement':
            return collectBindingIdentifiers(pattern.argument);
        case 'TSParameterProperty':
            return collectBindingIdentifiers(pattern.parameter);
        default:
            return [];
    }
};

export default {
    meta: {
        type: 'suggestion',
        docs: { description: 'Enforce camelCase (or UPPER_CASE) names for declared bindings; property names are not checked.' },
        schema: [],
        messages: { notCamelCase: "Identifier '{{name}}' is not in camel case." }
    },
    create(context) {
        const check = identifiers => {
            for (const identifier of identifiers) {
                if (isUnderscored(identifier.name)) {
                    context.report({ node: identifier, messageId: 'notCamelCase', data: { name: identifier.name } });
                }
            }
        };
        const checkFunction = node => check([...collectBindingIdentifiers(node.id), ...node.params.flatMap(collectBindingIdentifiers)]);
        const checkId = node => check(collectBindingIdentifiers(node.id));
        const checkLocal = node => check([node.local]);

        return {
            VariableDeclarator: checkId,
            FunctionDeclaration: checkFunction,
            FunctionExpression: checkFunction,
            ArrowFunctionExpression: checkFunction,
            ClassDeclaration: checkId,
            ClassExpression: checkId,
            TSInterfaceDeclaration: checkId,
            TSTypeAliasDeclaration: checkId,
            TSEnumDeclaration: checkId,
            CatchClause: node => check(collectBindingIdentifiers(node.param)),
            ImportSpecifier: checkLocal,
            ImportDefaultSpecifier: checkLocal,
            ImportNamespaceSpecifier: checkLocal
        };
    }
};
