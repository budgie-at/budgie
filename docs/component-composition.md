# Component Composition Guide

Rules for building React components that stay small, declarative, and composable. Written after the transaction context-menu refactor, where a 270-line component with an 11-prop child bag, 4 free functions above the component, and a 4-level delegate-hook chain had to be decomposed. This guide exists so that shape never appears again.

Enforced automatically where possible: the `budgie/max-component-props` ESLint rule (see `eslint-rules/max-component-props.mjs`) errors on any `Props` / `*PropsInterface` with more than 8 own members. The `allow` list in `eslint.config.mjs` is a grandfather register — it may only shrink. Never add a new file to it; refactor instead.

## 1. Prop budget: more than 8 props is a design failure

A component approaching the limit is almost always one of these, each with a known fix:

| Smell | Fix |
| --- | --- |
| Prop relay — parent computes N values, child just lays them out | Delete the relay component; render the leaf components directly in the parent (children composition) |
| Prop bag of `canX` booleans + `onX` handlers per menu/list item | Compound components reading shared context (see §2) |
| Boolean mode props (`isRefund`, `isCompact`) that switch icon/label/testID triples | Explicit variant components (see §3) |
| Config-object-as-props (10 display options) | Split the component, or accept `children` for the variable region |

Reaching for the grandfather list, an `eslint-disable`, or an `extends` chain to dodge the member count is prohibited. The rule counts own members only — inheriting 8 members via `extends Pick<...>` to hide them is the same failure wearing a coat.

## 2. Compound components over prop bags

When a parent renders a set of items that all need the same ambient data (the entity, a close function, a form), do not thread that data through props item-by-item and do not build an `Items` middleman component. Provide a small context and make each item self-contained.

Reference implementation: `packages/app/src/transaction/components/transaction-list-context-menu/` with `transaction/context/transaction-list-context-menu.context.ts`. The parent is a thin shell:

```tsx
<PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
    <TransactionListContextMenuContext.Provider value={contextValue}>
        <View className="py-sm">
            <TransactionListEditMenuItem />
            <TransactionListConvertToRefundMenuItem />
            <TransactionListConvertToTransferMenuItem />
            <TransactionListAttachDebtMenuItem />
            <TransactionListDeleteMenuItem />
            <TransactionListRevertMenuItem />
        </View>
    </TransactionListContextMenuContext.Provider>
</PopoverMenu>
```

Each item component:

- reads `{ transaction, closeMenu }` from the context (`use()` accessor, precedent: `transaction-actions-menu.context.ts`),
- computes its own visibility from the entity and returns `null` when hidden,
- owns its own action logic, hooks, and i18n strings,
- carries its own `testID` from the selector file.

The parent never knows which items are visible or what they do. Adding a menu action is adding one file plus one JSX line — no new props anywhere.

## 3. Explicit variants over boolean modes

A boolean prop that flips icon + label + testID together is two components wearing one name. Split them:

```tsx
// Bad — one component, boolean mode
<TransactionListConvertMenuItem isRefund onConvert={...} />
<TransactionListConvertMenuItem onConvert={...} />

// Good — two explicit components
<TransactionListConvertToRefundMenuItem />
<TransactionListConvertToTransferMenuItem />
```

Same for state-parametrized triples (`actionIcon`/`actionLabel`/`actionTestID` chosen by `isConsolidated`): render `<DeleteMenuItem />` or `<RevertMenuItem />` explicitly instead of parametrizing one item.

Visibility booleans follow the same logic: `isVisible` props are prohibited. Either the caller conditionally renders (`{canConvert ? <Item /> : null}`) or, in compound components, the item decides for itself from context.

## 4. Nothing above the component

A component file contains imports, the inline `Props` interface, and the component. That is the whole file.

- Multi-step pure derivations → private helpers are acceptable only while they are trivial one-liners; anything with branching belongs in a named function file per existing rules, or inside the dedicated child component that consumes it.
- A hook defined above a component → move it to the module's `hook/` folder. A hook earns its own file only if it encapsulates real state/refs/effects (rule 48); otherwise inline its body.
- An inline anonymous object type in a function signature → rule 19 violation; derive from existing interfaces (`Pick<...>`) or add a proper `/interface` file.
- Passing `t`, `formatDigits`, or other hook results as function parameters into module-level free functions is the tell that the function wants to be a component or a hook. Make it one.

## 5. Hooks must earn their existence

A hook whose body is one call to another hook plus constants (strings, an enum literal, a settings key) is ceremony — inline it into its consumers and delete it. Verified sweep (2026-07): the only legitimate shapes found app-wide are:

- `useSyncExternalStore` bridges to service singletons (canonical service→React boundary),
- hooks composing 2+ sources with real derived/branching logic,
- hooks holding state/refs/effects,
- shared shapes with high fan-out (e.g. `useDisplayFormatDigits`, 8 consumers).

Before creating a `useXxxActions`-style wrapper chain, count: every layer must add real composition (a modal + handler + navigation is the minimum bar), and single-consumer layers get inlined into the consumer component if that does not force a new lint disable. The update-transaction chain is the reference: it was 4 levels / 5 params interfaces and is now 2 levels / 2 interfaces with identical behavior.

## 6. Deferred-close menus (RN Modal safety)

Menu items whose action opens another modal/sheet must defer the action until the popover close completes: `closeMenu(afterClose)` stores the action, `onCloseComplete` runs it (`use-transaction-list-context-menu-close.hook.ts`). Running such actions synchronously before close completion recreates a Modal unmount/remount race that froze the UI (fixed 2026-07). Never "simplify" the pending-action ref away.
