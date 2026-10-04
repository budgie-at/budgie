const ACCESSIBILITIES = ['public', 'protected', 'private'];

const prefixAll = (prefixes, suffix) => prefixes.map(prefix => `${prefix}-${suffix}`);

const buildMemberGroups = type => [
    ...prefixAll(ACCESSIBILITIES, `static-${type}`),
    ...prefixAll(ACCESSIBILITIES, `decorated-${type}`),
    ...prefixAll(ACCESSIBILITIES, `instance-${type}`),
    ...prefixAll(['public', 'protected'], `abstract-${type}`),
    ...prefixAll(ACCESSIBILITIES, type),
    `static-${type}`,
    `instance-${type}`,
    `abstract-${type}`,
    `decorated-${type}`,
    type
];

const MEMBER_ORDER = [
    'signature',
    ...buildMemberGroups('field'),
    ...prefixAll(ACCESSIBILITIES, 'constructor'),
    'constructor',
    ...buildMemberGroups('get'),
    ...buildMemberGroups('set'),
    ...prefixAll(ACCESSIBILITIES, 'decorated-method'),
    ...prefixAll(ACCESSIBILITIES, 'instance-method'),
    ...prefixAll(['public', 'protected'], 'abstract-method'),
    ...prefixAll(ACCESSIBILITIES, 'method'),
    ...prefixAll(ACCESSIBILITIES, 'static-method'),
    'static-method',
    'instance-method',
    'abstract-method',
    'decorated-method',
    'method'
];

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionExpression']);

const ABSTRACT_TYPES = new Set(['TSAbstractAccessorProperty', 'TSAbstractPropertyDefinition', 'TSAbstractMethodDefinition']);

const getMemberType = member => {
    switch (member.type) {
        case 'TSAbstractMethodDefinition':
        case 'MethodDefinition':
            return member.kind;
        case 'TSAbstractPropertyDefinition':
            return member.readonly ? 'readonly-field' : 'field';
        case 'PropertyDefinition':
            if (FUNCTION_TYPES.has(member.value?.type)) {
                return 'method';
            }

            return member.readonly ? 'readonly-field' : 'field';
        case 'TSIndexSignature':
            return member.readonly ? 'readonly-signature' : 'signature';
        default:
            return null;
    }
};

const getAccessibility = member => {
    if (member.accessibility) {
        return member.accessibility;
    }

    return member.key?.type === 'PrivateIdentifier' ? '#private' : 'public';
};

const getScope = member => {
    if (member.static) {
        return 'static';
    }

    return ABSTRACT_TYPES.has(member.type) ? 'abstract' : 'instance';
};

const getCandidateGroups = (member, type) => {
    const accessibility = getAccessibility(member);
    const scope = getScope(member);
    const isReadonlyField = type === 'readonly-field';
    const groups = [];

    if (member.decorators?.length > 0) {
        groups.push(`${accessibility}-decorated-${type}`, `decorated-${type}`);
    }

    if (type !== 'signature' && type !== 'readonly-signature') {
        if (type !== 'constructor') {
            groups.push(`${accessibility}-${scope}-${type}`, `${scope}-${type}`);

            if (isReadonlyField) {
                groups.push(`${accessibility}-${scope}-field`, `${scope}-field`);
            }
        }

        groups.push(`${accessibility}-${type}`);

        if (isReadonlyField) {
            groups.push(`${accessibility}-field`);
        }
    }

    groups.push(type, ...(isReadonlyField ? ['field'] : []), ...(type === 'readonly-signature' ? ['signature'] : []));

    return groups;
};

const getRank = member => {
    const type = getMemberType(member);

    if (type === null || member.value?.type === 'TSEmptyBodyFunctionExpression') {
        return -1;
    }

    const group = getCandidateGroups(member, type).find(candidate => MEMBER_ORDER.includes(candidate));

    return group === undefined ? -1 : MEMBER_ORDER.indexOf(group);
};

const getMemberName = member => member.key?.name ?? member.key?.value ?? member.kind ?? member.type;

export default {
    meta: {
        type: 'suggestion',
        docs: { description: 'Enforce class member order: fields, constructor, accessors, then public before protected before private methods, static methods last.' },
        schema: [],
        messages: { outOfOrder: "Member '{{name}}' should be declared before all {{group}} definitions." }
    },
    create(context) {
        const checkClass = node => {
            let highest = { rank: -1, group: '' };

            for (const member of node.body.body) {
                const rank = getRank(member);

                if (rank === -1) {
                    continue;
                }

                if (rank < highest.rank) {
                    context.report({ node: member, messageId: 'outOfOrder', data: { name: getMemberName(member), group: highest.group } });
                } else {
                    highest = { rank, group: MEMBER_ORDER[rank] };
                }
            }
        };

        return { ClassDeclaration: checkClass, ClassExpression: checkClass };
    }
};
