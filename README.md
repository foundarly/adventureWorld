# Adventure World: Website

A one-page website for **Adventure World**, an adventure park near Vepalagadda, Kothagudem, Bhadradri Kothagudem district, Telangana.
It's built with plain **HTML, CSS and JavaScript**, plus **GSAP** for scroll effects. You don't need to install anything.

---

## 📁 What's in this folder

| File / folder | What it does |
|---|---|
| `index.html` | The **content**: all the text, sections, buttons and images. |
| `style.css` | The **look**: colours, fonts, spacing, animations and mobile layouts. |
| `script.js` | The **behaviour**: menu, scroll animations, gallery preview, form checks. It also holds the **business details settings box** at the top. |
| `js/scene-kit.js`, `js/valley.js`, `js/bumper-scene.js`, `js/bungee-scene.js` | Three.js 3D scenes (bumper-car arena, bungee jump). **Not loaded any more**: those sections were removed. Kept in case you want them back (they need Three.js r128 added to `index.html`). |
| `js/buggy-scene.js`, `js/jumping-scene.js` | 3D Buggy Rides and trampoline-park scenes. **Not loaded any more** (the first screen now uses real photos); kept in case you want them back. |
| `js/motion.js` | Scroll effects with GSAP: photo parallax, gallery photos settling, the word band. |
| `js/rides-scene.js` | 3D scenes (Three.js) for the Giant Wheel, Ziplining, Go-Kart Racing, Pirate Ship Ride and Water Slides cards. Loaded by `script.js` together with `js/scene-kit.js`, only on desktops/laptops; only the card in the middle of the carousel animates. |
| `js/hero-scene.js` | An older 3D first screen. **Not loaded any more** (the hero is now a photo slideshow); kept in case you want it back. |
| `assets/favicon.svg` | The little logo shown in the browser tab. |
| `assets/images/` | Put the park's **real photos** here (see the README inside). |

GSAP 3.12.5 + ScrollTrigger (scroll effects, from cdnjs) are loaded at the bottom of `index.html`, so they aren't files in this folder.
Three.js r128 (from cdnjs) is fetched by `script.js` only when the activity carousel comes near the screen on a device that runs the 3D cards.
If they can't load, the site still works; the scroll effects or 3D are just skipped. Scrolling is the browser's own (no scroll-smoothing library), which keeps it fast on every device.

---

## ▶️ How to open the website

### Option A: Quickest
Double-click `index.html` in File Explorer. It opens in your web browser.

### Option B: Recommended (auto-refresh while you edit)
1. In VS Code, click the **Extensions** icon on the left (four squares), or press `Ctrl+Shift+X`.
2. Search for **Live Server** (by Ritwick Dey) and click **Install**.
3. Right-click `index.html` in the file list and choose **Open with Live Server**.
4. Your browser opens the site. Every time you **save** a file (`Ctrl+S`), the page refreshes automatically.

> An internet connection is needed for the fonts and GSAP.

---

## ✏️ Common edits

### Add the real address, phone and email
Open `script.js`. At the very top is `SITE_CONFIG`:

```js
const SITE_CONFIG = {
  address: "",          // ← put the exact address between the quotes
  phone: "",            // ← e.g. "+91 98xxxxxxxx"
  email: "",            // ← e.g. "info@yourpark.com"
  whatsapp: "",         // ← e.g. "9198xxxxxxxx" (digits only)
  enquiryMethod: "none",
  ...
};
```

Fill in what you have and save. The visit section, footer and **Get directions** button update automatically.
Leave a value as `""` and the site shows "To be added" / "To be announced" instead.
(There is no map yet, because the park's exact location isn't confirmed.)

### Make the enquiry form actually send messages
Change `enquiryMethod` in `SITE_CONFIG`:

| Value | What happens when a visitor presses "Send Enquiry" |
|---|---|
| `"none"` (default) | Details are checked, but **nothing is sent**. The visitor is told this honestly. |
| `"email"` | The visitor's email app opens with the enquiry filled in, addressed to `email`. |
| `"whatsapp"` | WhatsApp opens with the enquiry, addressed to `whatsapp`. |
| `"endpoint"` | Sent to a free form service such as [Formspree](https://formspree.io). Paste the form URL it gives you into `formEndpoint`. |

The form never says a booking is confirmed. It always makes clear this is an **enquiry**.
Never put passwords or secret keys in these files. Anyone can read a website's code.

### Rename, remove or add an activity
In `index.html`, find `<div class="thrill-track" id="thrill-track">` ("Feel the Thrill"). Each activity is one card,
`<a class="thrill-card" data-activity="...">`. The carousel picks up any number of cards by itself.

- **Rename:** change the name text (`tc-name` / `tm-name`) and the `data-activity="..."` value (and `data-enquire="..."` if the card has one).
- **Remove / add:** delete or copy a whole card (`<a ...> ... </a>`).

The "Interested in" list in the enquiry form updates itself from these cards.

### The first screen: real photos (and videos once added)
The first screen ("Explore Adventure World") cycles through full-screen real photos with a slow camera move:
**01 Bumping Cars**, **02 Bungee Jumping** and **03 Buggy Rides**. Visitors can click a label to jump to one, or pause.
Underneath is **Select your Adventure World**: Bhadradri Kothagudem (the district) and Vepalagadda (the park).

To show **real video**, see `assets/video/README.txt`: put the files in `assets/video/` and write their paths in
`heroVideos` at the top of `script.js`. The video then plays over the photo, on the first screen and in the
matching "Pick your thrill" card. Jumping Activities has no photo yet: add one (or a video) to bring it back to the
first screen (see the comment in `index.html`).

### Colours
Warm cream pages, near-black text and dark bands, deep green accent words on light backgrounds and bright light green on pictures and dark areas.
They are set once at the top of `style.css` under `:root` (`--night`, `--accent`, `--mint`, `--sand`, `--green`, `--ivory`).

### Replace the sample photos
See `assets/images/README.txt`. Each 3D scene also has a fallback photo (`class="scene-fallback"`) that is only shown when 3D can't run.

### Change colours or fonts
Open `style.css`. At the top, under `:root`, you'll find named colours like `--night`, `--forest`, `--sand`, `--ivory` and `--lime`.
Change a value once and it updates everywhere. The fonts are Cormorant Garamond (headlines) and Manrope (text).

---

## ✅ Features

- **Cinematic photo hero:** three photos cross-fade with a slow zoom, with tabs, a pause button and an **Explore Activities** button.
- **Feel the Thrill carousel:** large portrait cards for Bumping Cars, Bungee Jumping, Buggy Rides, Jumping Activities, Giant Wheel, Ziplining, Go-Kart Racing, Pirate Ship Ride and Water Slides. The current card sits in the middle with its neighbours peeking in; it loops, and moves with the round arrows (the one used last is yellow), the ← → keys, mouse drag or touch swipe. Five cards show live 3D scenes on desktops.
- **Groups** cards (families, friends, schools, teams) and a **Know before you go** strip. These only invite an enquiry; nothing is promised until the park confirms it.
- A floating navigation capsule, a progress bar, and a full-screen mobile menu.
- A "bento" gallery with a full-size preview (← → keys, Esc to close), and the enquiry form.
- Keyboard-friendly, with visible focus rings, screen-reader labels and a "Skip to main content" link.
- Respects the "reduce motion" setting: the first screen stays on one still photo.

## 📷 Image and 3D credits
Sample photos are from [Unsplash](https://unsplash.com) (free to use under the Unsplash License).
They are **placeholders** and do not show Adventure World. The 3D scenes are **illustrations** built in code,
not models of the park's actual site or rides.

### Using real 3D models later
The cars, platform and jumper are real 3D geometry, but they are built in code rather than modelled from the park's rides.
To show the park's actual equipment in 3D you would need a `.glb` model, for example from:
- a 3D artist working from photos and measurements of the real rides,
- a photogrammetry scan (many photos of the ride turned into a model), or
- a licensed model from a library such as Sketchfab or Poly Pizza (check the licence allows commercial use).
It can then be loaded with Three.js's `GLTFLoader` in place of the code-built car or platform.
