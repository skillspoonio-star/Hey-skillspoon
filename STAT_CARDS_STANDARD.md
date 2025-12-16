# Standard Stat Cards Pattern

Apply this exact pattern to ALL dashboard sections for consistency.

## Grid Layout
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
// or lg:grid-cols-5 if you have 5 cards
```

## Card Structure
```tsx
<Card className="border-l-4 border-l-{color}-500 hover:shadow-lg transition-all duration-200">
  <CardContent className="p-6">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-{color}-500/10 rounded-full">
        <IconComponent className="w-6 h-6 text-{color}-600 dark:text-{color}-500" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Label</p>
        <p className="text-3xl font-bold text-{color}-600 dark:text-{color}-500">{value}</p>
        <p className="text-xs text-muted-foreground">Subtitle</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## Color Scheme
- Yellow (500): Pending/Warning states
- Orange (500): Preparing/In Progress
- Green (500): Completed/Success
- Blue (500): Info/Total
- Purple (500): Revenue/Special
- Amber (500): Alerts/Attention needed
- Red (500): Critical/Urgent

## Completed Sections
✅ Home - 5 cards
✅ Counter - 5 cards  
✅ Takeaway - 5 cards
✅ Delivery - 4 cards

## Remaining Sections to Update
- Kitchen Display
- Table Management
- Table Assignment
- Reservations
- Payment
- Analytics
- Menu Management
- Inventory (already has 3 cards, needs consistency check)
- Staff (already has 4 cards per tab, needs consistency check)
