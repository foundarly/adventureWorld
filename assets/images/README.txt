PUT ADVENTURE WORLD'S REAL PHOTOS IN THIS FOLDER
================================================

Right now the website uses SAMPLE photos from Unsplash (free stock photos).
They are NOT photos of Adventure World. Replace them before publishing.

How to replace a photo:
1. Copy the real photo into this folder, e.g.  assets/images/bungee.jpg
   (Use simple file names: lowercase, no spaces.)
2. Open index.html and find the <img> you want to change.
3. Change its src="https://images.unsplash.com/..." to  src="assets/images/bungee.jpg"
   - If the image has a srcset="..." part, delete it too.
   - The 3D scenes don't use photos, except a fallback photo (class="scene-fallback")
     that only appears when 3D can't run on a visitor's device.
   - Gallery images: change BOTH src="..." and data-full="..." to your file.
4. Update the alt="..." text so it describes the new photo.

Tips for fast loading:
- Resize photos to about 1600px wide (hero) or 900px wide (cards/gallery).
- Save as .jpg (or .webp) at around 70-80% quality. Aim for under 300 KB each.
- Only use photos the company owns or has permission to use.
