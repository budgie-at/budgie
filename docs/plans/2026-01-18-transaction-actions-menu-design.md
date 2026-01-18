# Transaction Actions Menu Design

## Overview

Replace bottom footer buttons with a slick 60fps animated popover dropdown menu triggered from the PageHeader. This modernizes the transaction edit UI and provides a cleaner, more native-feeling experience.

## Goals

- Move Delete and Convert actions from footer to header menu
- Simplify footer to only the primary "Update" button
- Achieve 60fps animations using Reanimated
- Maintain consistency across expense, income, and transfer pages

## Component Architecture

### New Components

```
src/@generic/component/
├── popover-menu/
│   └── popover-menu.tsx          # Reusable animated popover container
├── popover-menu-item/
│   └── popover-menu-item.tsx     # Individual menu row with icon
└── popover-menu-trigger/
    └── popover-menu-trigger.tsx  # Three-dot button wrapper

src/transaction/components/
└── transaction-actions-menu/
    └── transaction-actions-menu.tsx  # Transaction-specific menu
```

### Data Flow

```
PageHeader
    └── rightAction={<TransactionActionsMenu />}
                            │
                            ▼
                    PopoverMenu (absolute positioned)
                        ├── PopoverMenuItem: "Change Type" → opens ConvertBottomSheet
                        └── PopoverMenuItem: "Delete" (red) → opens ConfirmDelete
```

## Component Specifications

### PopoverMenu

```typescript
interface PopoverMenuProps {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly children: ReactNode;
    readonly anchorPosition?: 'top-right' | 'top-left';
}
```

**Animation specs:**
- Enter: FadeIn + scale 0.95→1.0, spring damping 20, stiffness 300
- Exit: FadeOut 150ms
- 60fps native thread via Reanimated

**Styling:**
- Container: `bg-card rounded-2xl shadow-lg border border-border min-w-[200px]`
- Backdrop: semi-transparent, tap to dismiss

### PopoverMenuItem

```typescript
interface PopoverMenuItemProps {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly onPress: EmptyFn;
    readonly variant?: 'default' | 'destructive';
    readonly rightLabel?: string;
}
```

**Styling:**
- Row: `px-lg py-md flex-row items-center gap-md`
- Pressed state: `bg-muted/50`
- Destructive variant: red text and icon

### TransactionActionsMenu

```typescript
interface TransactionActionsMenuProps {
    readonly onDelete: EmptyFn;
    readonly onChangeType?: EmptyFn;
    readonly currentType: 'expense' | 'income' | 'transfer';
}
```

**Menu items by type:**
| Type | Items |
|------|-------|
| Expense | Change Type, Delete |
| Income | Change Type, Delete |
| Transfer | Delete only |

## Integration

### PageHeader Changes

Add `rightAction` prop:

```typescript
interface PageHeaderProps {
    // ... existing props
    readonly rightAction?: ReactNode;
}
```

### Footer Simplification

Before:
```
[Delete] [Convert] [====Update Expense====]
```

After:
```
[=========Update Expense=========]
```

### Transaction Page Usage

```tsx
<PageHeader
    title={t`Edit Expense`}
    rightAction={
        <TransactionActionsMenu
            onDelete={handleDelete}
            onChangeType={handleOpenConvert}
            currentType="expense"
        />
    }
/>
```

## Files Changed

### Create
- `src/@generic/component/popover-menu/popover-menu.tsx`
- `src/@generic/component/popover-menu-item/popover-menu-item.tsx`
- `src/transaction/components/transaction-actions-menu/transaction-actions-menu.tsx`

### Modify
- `src/@generic/component/page-header/page-header.tsx` - add rightAction prop
- `src/transaction/components/transaction-form-footer/transaction-form-footer.tsx` - simplify
- `src/app/(main)/transactions/[id]/expense.tsx` - integrate menu
- `src/app/(main)/transactions/[id]/income.tsx` - integrate menu
- `src/app/(main)/transactions/[id]/transfer.tsx` - integrate menu

## Dependencies

No new packages required. Uses existing:
- `react-native-reanimated` ~4.1.1
- `react-native-gesture-handler` ~2.28.0

## Dismissal Behavior

- Tap outside menu → close
- Tap menu item → close + execute action
- Hardware back (Android) → close
- Scroll page → close
