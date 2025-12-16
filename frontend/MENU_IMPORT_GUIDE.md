# Menu Import Guide

## How to Import Menu Items

The Menu Management system supports importing menu items from JSON files. This allows you to bulk upload menu items instead of adding them one by one.

### Supported File Format

- **JSON files** (`.json` extension)

### Required Fields

Each menu item in your JSON file must have these required fields:
- `name` (string) - Name of the menu item
- `description` (string) - Description of the item
- `price` (number) - Price of the item

### Optional Fields

You can also include these optional fields:
- `category` (string) - Category (defaults to "Main Course")
- `isAvailable` (boolean) - Availability status (defaults to true)
- `isVeg` (boolean) - Vegetarian flag (defaults to false)
- `isSpicy` (boolean) - Spicy flag (defaults to false)
- `isPopular` (boolean) - Popular flag (defaults to false)
- `prepTime` (string) - Preparation time (defaults to "15 min")
- `image` (string) - Image URL
- `ingredients` (array) - List of ingredients
- `allergens` (array) - List of allergens
- `calories` (number) - Calorie count
- `rating` (number) - Rating (1-5)
- `popularity` (number) - Popularity percentage (0-100)
- `cost` (number) - Cost price
- `profit` (number) - Profit (auto-calculated if cost is provided)
- `tags` (array) - List of tags

### JSON File Structure

Your JSON file should contain an array of menu items:

```json
[
  {
    "name": "Margherita Pizza",
    "description": "Classic pizza with fresh tomatoes, mozzarella cheese, and basil leaves",
    "price": 299,
    "category": "Main Course",
    "isAvailable": true,
    "isVeg": true,
    "isSpicy": false,
    "isPopular": true,
    "prepTime": "20 min",
    "ingredients": ["Tomatoes", "Mozzarella", "Basil", "Pizza Dough"],
    "allergens": ["Gluten", "Dairy"],
    "calories": 250,
    "rating": 4.5,
    "popularity": 85,
    "cost": 150,
    "tags": ["Italian", "Classic"]
  },
  {
    "name": "Chicken Biryani",
    "description": "Aromatic basmati rice cooked with tender chicken pieces",
    "price": 399,
    "category": "Main Course",
    "isVeg": false,
    "isSpicy": true
  }
]
```

### Sample File

A sample import file (`sample-menu-import.json`) is included in the frontend folder that you can use as a template.

### How to Import

1. Click the "Import" button in the Menu Management interface
2. Select your JSON file
3. The system will validate each item and show any errors
4. Confirm the import to add valid items to your menu
5. Items with errors will be skipped, but valid items will still be imported

### Error Handling

The import system will:
- Validate required fields for each item
- Skip items with missing or invalid data
- Show a summary of errors found
- Import only valid items
- Generate unique IDs for imported items
- Calculate profit automatically if cost is provided

### Tips

- Use the Export feature to see the exact format of existing menu items
- Test with a small file first to ensure your format is correct
- Keep a backup of your data before importing large files
- Review imported items after import to ensure they look correct