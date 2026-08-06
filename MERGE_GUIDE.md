# MenuHub Cart UI Update - Merge Guide

## Overview
This guide walks you through merging the cart UI improvements into your existing MenuHub project. The changes include:
- Renaming "Add to Tray" to "Add to Cart"
- Removing the top-left cart icon
- Repurposing "Order Now" button to open the cart modal
- Keeping "Call Waiter" button for quick waiter calls

## Prerequisites
- Git installed and configured
- Node.js and npm installed
- Your MenuHub repository cloned locally

## Step-by-Step Merge Instructions

### Step 1: Create a New Branch
```bash
git checkout -b feature/cart-ui-improvements
```

### Step 2: Update Component Files

#### 2.1 Replace `src/components/OrderTray.tsx` with `src/components/OrderCart.tsx`

**Option A: Using File Rename (Recommended)**
```bash
# If you're using the new OrderCart.tsx file
git rm src/components/OrderTray.tsx
git add src/components/OrderCart.tsx
```

**Option B: Manual Update**
If you want to keep the existing file name, rename all references:
- In `src/components/CustomerMenuWithTabs.tsx`:
  - Change `import OrderTray from '@/components/OrderTray'` 
  - To: `import OrderCart from '@/components/OrderCart'`
  - Change `<OrderTray` to `<OrderCart`

#### 2.2 Update `src/components/CustomerMenuWithTabs.tsx`

Replace the entire file with the updated version. Key changes:
- Line 5: Import `OrderCart` instead of `OrderTray`
- Lines 19-34: Translation updates (addToCart: "Add to Cart")
- Lines 67-91: Component props now include cart state management
- Lines 131-145: Removed top-left cart button
- Lines 147-159: Language switcher now on the right only
- Lines 118-124: Updated OrderCart component usage

#### 2.3 Update `src/components/WhatsAppOrderButton.tsx`

Replace the entire file with the updated version. Key changes:
- New props: `onCartOpen` and `cartCount`
- "Order Now" button now calls `onCartOpen()` instead of WhatsApp
- Shows cart item count badge
- "Call Waiter" button styling updated
- Improved responsive design for mobile

#### 2.4 Create New File: `src/components/MenuPageClient.tsx`

Create this new component for centralized cart state management:
- Manages `cartItems` state
- Manages `isCartOpen` state
- Provides cart functions: `addToCart`, `updateQuantity`, `removeFromCart`, `handleSubmitOrder`
- Passes state to both `CustomerMenuWithTabs` and `WhatsAppOrderButton`

#### 2.5 Update `src/app/menu/[slug]/page.tsx`

Replace the entire file with the updated version. Key changes:
- Line 4: Import `MenuPageClient` instead of `CustomerMenuWithTabs`
- Line 5: Remove `WhatsAppOrderButton` import (now in MenuPageClient)
- Lines 150-158: Replace menu rendering with `<MenuPageClient />` component

### Step 3: Verify All Imports

Run this command to check for any import errors:
```bash
grep -r "OrderTray" src/
```

Expected output: Should be empty (no references to OrderTray should remain)

### Step 4: Test Locally

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000/menu/[your-business-slug]` and verify:
- ✅ "Add to Cart" buttons appear instead of "Add to Tray"
- ✅ No cart icon in the top-left
- ✅ Language switcher is on the right
- ✅ "Order Now" button opens the cart modal
- ✅ Cart shows items correctly
- ✅ "Call Waiter" button still works
- ✅ Mobile responsive design works

### Step 5: Commit Changes

```bash
git add .
git commit -m "feat: update cart UI - rename to Add to Cart, remove top-left icon, repurpose Order Now button

- Rename 'Add to Tray' to 'Add to Cart' across all languages
- Remove top-left cart icon for cleaner layout
- Repurpose 'Order Now' button to open cart modal
- Create MenuPageClient for centralized cart state management
- Rename OrderTray component to OrderCart
- Update responsive design for mobile and desktop
- Keep 'Call Waiter' button for quick waiter calls"
```

### Step 6: Push to Remote

```bash
git push origin feature/cart-ui-improvements
```

### Step 7: Create Pull Request

On GitHub:
1. Go to your repository
2. Click "Compare & pull request"
3. Add description of changes
4. Request review if needed
5. Merge to `main` branch

### Step 8: Deploy

After merging to main:
```bash
git checkout main
git pull origin main

# Deploy to your hosting platform
# (Netlify, Vercel, or your custom deployment)
npm run build
```

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `src/components/OrderTray.tsx` | Rename to `OrderCart.tsx` | Update all references |
| `src/components/OrderCart.tsx` | Create/Update | New component name |
| `src/components/CustomerMenuWithTabs.tsx` | Update | Remove top-left cart, update imports |
| `src/components/WhatsAppOrderButton.tsx` | Update | Repurpose Order Now button |
| `src/components/MenuPageClient.tsx` | Create | New state management component |
| `src/app/menu/[slug]/page.tsx` | Update | Use MenuPageClient |

## Database Changes

✅ **No database changes required** - The existing Prisma schema already supports all functionality:
- `Order` model exists for order persistence
- `waiterCallNumber` field exists in `Business` model
- `Staff` model exists for waiter assignment

## Troubleshooting

### Issue: "Cannot find module OrderTray"
**Solution**: Make sure you've renamed the file and updated all imports to use `OrderCart`

### Issue: Cart button not opening
**Solution**: Verify that `MenuPageClient` is properly passing `onCartOpen` prop to `WhatsAppOrderButton`

### Issue: Styling looks off on mobile
**Solution**: Clear browser cache and rebuild:
```bash
npm run build
```

### Issue: Language switcher not working
**Solution**: Verify that `setLang` state is properly managed in `CustomerMenuWithTabs`

## Rollback Instructions

If you need to revert these changes:

```bash
# If not yet merged to main
git reset --hard HEAD~1

# If already merged to main
git revert <commit-hash>
git push origin main
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the component files for prop types
3. Test in development mode with `npm run dev`
4. Check browser console for errors

---

**Last Updated**: August 2026
**Version**: 1.0
