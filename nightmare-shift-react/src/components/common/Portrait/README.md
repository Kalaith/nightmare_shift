# Portrait Component

A React component for displaying character portraits with emoji fallback support.

## Usage

```tsx
import Portrait from '../../common/Portrait/Portrait';

<Portrait 
  passengerName="Mrs. Chen"
  emoji="👵"
  size="medium"
  className="custom-class"
/>
```

## Props

- `passengerName` (string): The exact name of the passenger (must match gameData.ts names)
- `emoji` (string): Fallback emoji if portrait image fails to load or doesn't exist
- `size` (optional): 'small' (80px), 'medium' (128px), 'large' (160px). Default: 'medium'
- `className` (optional): Additional CSS classes

## Image Requirements

Portrait images should be placed in `/public/nightmare_shift/assets/` with ID-based filenames matching the imagePrompts.json structure:

- `1.png` (Mrs. Chen)
- `2.png` (Jake Morrison)
- `3.png` (Sarah Woods)
- `4.png` (Dr. Hollow)
- `5.png` (The Collector)
- `6.png` (Tommy Sullivan)
- `7.png` (Elena Vasquez)
- `8.png` (Marcus Thompson)
- `9.png` (Nurse Catherine)
- `10.png` (Old Pete)
- `11.png` (Madame Zelda)
- `12.png` (Frank the Pianist)
- `13.png` (Sister Agnes)
- `14.png` (Detective Morrison)
- `15.png` (The Midnight Mayor)
- `16.png` (Death's Taxi Driver)

## Features

- **Automatic fallback**: Shows emoji if image fails to load
- **Error handling**: Graceful degradation if portrait doesn't exist
- **Responsive sizing**: Three predefined sizes with consistent styling
- **Optimized loading**: Images load asynchronously with error state management

## Image Specifications

- **Format**: PNG format for transparency support and quality
- **Size**: 1024x1024px source recommended (will be scaled down)
- **Style**: Dark foggy night background with city lights (as per prompts)
- **Framing**: 50mm portrait style for consistency

## Integration Status

The Portrait component has been integrated into:

- ✅ Ride Request (GameScreen)
- ✅ Drop-off Feedback (DropOffState)  
- ✅ Character Database (cards and details)
- ✅ Guideline Interactions
- ✅ Guideline Choice dialogs