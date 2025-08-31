# Portrait Size Reference

## Updated Portrait Sizes

The Portrait component now uses larger, more visible sizes:

| Size | Dimensions | Tailwind Classes | Usage |
|------|-----------|------------------|-------|
| `small` | 80x80px | `w-20 h-20` | Guideline choice headers, compact UI |
| `medium` | 128x128px | `w-32 h-32` | Ride requests, character cards, drop-off feedback |
| `large` | 160x160px | `w-40 h-40` | Character database details, main interactions |

## Size Comparison

**Before:**
- Small: 48px (too small)
- Medium: 64px (hard to see details)
- Large: 96px (still small for portraits)

**After:**
- Small: 80px (readable and clear)
- Medium: 128px (perfect for UI cards)
- Large: 160px (great for detailed views)

## Emoji Fallback Sizes

When portraits fail to load, emoji sizes are scaled appropriately:
- Small: `text-4xl` (36px)
- Medium: `text-6xl` (60px) 
- Large: `text-8xl` (96px)

This ensures consistent visual hierarchy whether showing portraits or emoji fallbacks.