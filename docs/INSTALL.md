# Putting Star Station on a tablet

Star Station is a web app that installs onto the tablet's home screen and then runs with no internet at all. Nothing is public unless you make it public. Pick one of the two options below.

**One thing to know first.** Tablets will only *install* a web app for offline use from a secure (`https://`) address. Option A gives you that automatically. Option B works right away over your home Wi-Fi, but for a true offline install from your own PC you also need the free Tailscale step (B2).

You need the built app, the `dist` folder. To make it on any computer with [Node.js](https://nodejs.org) 20 or newer installed:

```
npm install
npm run build
```

This makes a `dist` folder (about 21 MB, mostly the recorded narration). The recordings are already in the repository, so you don't need to install the voice tools.

---

## Option A: a private hosted page you control

Any static web host works. This walk-through uses **Cloudflare Pages** with **Cloudflare Access**, because both have a free tier and Access lets only you in. Menu names change from time to time; the ideas stay the same.

1. Make a free Cloudflare account.
2. **Workers & Pages → Create → Pages → Upload assets.** Give the project a name that's hard to guess (for example `star-station-7k2q`), then drag in the **contents** of the `dist` folder. Cloudflare gives you an address like `https://star-station-7k2q.pages.dev`.
3. Lock it down: **Zero Trust → Access → Applications → Add an application → Self-hosted.** Use your `pages.dev` address as the application domain, and add a policy that allows **only your own email address** (login method: one-time PIN). Now anyone opening the address must type a code that's emailed to you.
4. On the tablet, open the address, sign in with the emailed code, and install it (see "Install on the tablet" below).

Notes:
- The host can see that files were downloaded (all web hosts keep basic access logs). The app itself never sends anything anywhere.
- GitHub Pages is **not** private for personal accounts, so don't use it unless you're happy for the page to be public.
- To update later, run `npm run build` again and upload the new `dist` contents to the same project. The tablet picks up the new version the next time it opens Star Station while online.

## Option B: run it from your PC on the home network

### B1. Quick: play over Wi-Fi while the PC is on

1. On the PC, in the project folder:
   ```
   npm install
   npm run build
   npm run serve:lan
   ```
   It prints a few addresses. Use the one that starts with your home network's numbers, for example `http://192.168.1.23:4173`.
2. On the tablet (same Wi-Fi), open that address in Safari or Chrome. It plays straight away.
3. Leave the window on the PC open while the children play. Press `Ctrl+C` to stop it.

If the tablet can't connect, allow Node.js through the PC's firewall for private networks.

With a plain `http://` address, the tablet won't keep an offline copy. That's the browser's rule, not the app's. For offline play, add B2.

### B2. Private and offline: add Tailscale (free)

[Tailscale](https://tailscale.com) makes a private network between your own devices and gives the PC a secure `https://` address that only your devices can reach.

1. Install Tailscale on the PC and on the tablet, and sign in to the same account on both.
2. In the Tailscale admin console, under **DNS**, turn on **MagicDNS** and **HTTPS certificates**.
3. On the PC, start Star Station (`npm run serve:lan`), then in a second terminal run:
   ```
   tailscale serve --bg 4173
   ```
   It prints an address like `https://my-pc.tail1234.ts.net`. (If the command has changed, look up "Tailscale serve" in their docs.)
4. On the tablet, with Tailscale switched on, open that address and install it (below). After the first full load you can switch Tailscale off and turn the PC off. The app keeps working.

Only devices signed in to your Tailscale account can reach that address. It is not on the public internet.

---

## Install on the tablet

Open the address once **while online** and wait about 30 seconds on the home screen, so it can save every file (about 21 MB). Then:

- **iPad (Safari):** tap the **Share** button, then **Add to Home Screen**, then **Add**.
- **Android (Chrome):** tap the **⋮** menu, then **Install app** (or **Add to Home screen**).

Open Star Station from the new home-screen icon. To check it works offline, turn on Airplane Mode and play a mission.

### Nice extras for little hands

- **iPad Guided Access** (Settings → Accessibility → Guided Access) keeps the tablet inside Star Station until you triple-click to leave.
- **Android screen pinning** (Settings → Security → App pinning) does the same.
- Keep the tablet's own volume low too; Star Station already starts quiet.

### Where things are saved

Names, avatars, settings and stickers are saved only in the tablet's browser storage for Star Station. Removing the app from the home screen, or clearing the browser's website data, erases them. Nothing is stored anywhere else.
