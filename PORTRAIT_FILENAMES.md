# Portrait Image Filenames Reference

Based on the imagePrompts.json structure, place your 16 character portrait images in `/public/nightmare_shift/assets/` with these exact filenames:

## Required Filenames:

| ID | Filename | Character Name |
|----|----------|----------------|
| 1  | `1.png`  | Mrs. Chen |
| 2  | `2.png`  | Jake Morrison |
| 3  | `3.png`  | Sarah Woods |
| 4  | `4.png`  | Dr. Hollow |
| 5  | `5.png`  | The Collector |
| 6  | `6.png`  | Tommy Sullivan |
| 7  | `7.png`  | Elena Vasquez |
| 8  | `8.png`  | Marcus Thompson |
| 9  | `9.png`  | Nurse Catherine |
| 10 | `10.png` | Old Pete |
| 11 | `11.png` | Madame Zelda |
| 12 | `12.png` | Frank the Pianist |
| 13 | `13.png` | Sister Agnes |
| 14 | `14.png` | Detective Morrison |
| 15 | `15.png` | The Midnight Mayor |
| 16 | `16.png` | Death's Taxi Driver |

## Directory Structure:
```
public/
  nightmare_shift/
    assets/
      1.png
      2.png
      3.png
      ...
      16.png
```

## Notes:
- All files should be `.png` format
- Images will be automatically resized by the Portrait component
- If any file is missing, the system will fallback to emoji display
- The mapping is handled automatically by PortraitService.ts