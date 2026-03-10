# Events carousel images

Add your **24 event images** here. They will appear in order on the **Events** page carousel.

## Option 1: Use the default names (easiest)

Name your files:

- `event-01.jpg` through `event-24.jpg`

(You can use `.png` or `.jpeg` if you prefer; then update the paths in `src/data/events-images.ts` to match.)

## Option 2: Use your own filenames

1. Add your image files to this folder (`public/img/events/`).
2. Open `src/data/events-images.ts` in the project root.
3. Replace the list with your image paths, e.g.:
   - `'/img/events/your-photo-1.jpg'`
   - `'/img/events/your-photo-2.jpg'`
   - … (24 total)

Paths must start with `/img/events/` and match the file names in this folder.
