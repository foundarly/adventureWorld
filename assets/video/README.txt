PUT THE HERO BACKGROUND VIDEOS IN THIS FOLDER
=============================================

The first screen cycles through four full-screen scenes:
  1. Bumping Cars   2. Bungee Jumping   3. Buggy Rides   4. Jumping Activities
Each one is a live 3D animation built in code. Adding a real video for
a scene makes the video play over that scene's 3D. The keys in
script.js are: bumper, bungee, buggy, jumping.

1. Add the files here, for example:
     assets/video/bumper-cars.mp4         (desktop, required)
     assets/video/bumper-cars.webm        (optional, usually smaller)
     assets/video/bumper-cars-mobile.mp4  (optional, for phones)
     assets/video/bungee.mp4
     assets/video/bungee.webm
     assets/video/bungee-mobile.mp4

2. Open script.js and fill in heroVideos at the top:
     heroVideos: {
       bumper: { webm: "assets/video/bumper-cars.webm", mp4: "assets/video/bumper-cars.mp4", mobile: "assets/video/bumper-cars-mobile.mp4" },
       bungee: { webm: "assets/video/bungee.webm",      mp4: "assets/video/bungee.mp4",      mobile: "assets/video/bungee-mobile.mp4" }
     },
   and set heroVideoNote, e.g. "Footage from Adventure World".

3. (Optional) Change each scene's poster photo in index.html
   (poster="..." on the <video>). It shows while the video loads,
   on data-saver connections, and for visitors who turn off motion.

Recommended video settings
- Length 8–15 seconds, cut so the end flows back into the start (it loops).
- No sound needed (the video always plays muted).
- Desktop: 1920x1080 or 1280x720, H.264 MP4, about 3–5 MB per clip.
- Phone: 720 wide (or 720x1280 vertical), about 1–2 MB.
- WebM (VP9) of the same clip is usually 30–50% smaller.
- Free tool to compress/trim: HandBrake (handbrake.fr), preset
  "Web > Vimeo YouTube 720p30", then untick audio.
- Keep the action near the centre: the heading sits in the middle.

Only use footage the park owns or is licensed to use.
Openly licensed clips exist on Wikimedia Commons (search "bumper cars",
"bungee jump"); check the licence and credit the author as it asks.
