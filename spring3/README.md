# Spring 3 UI

The Spring 3 UI is a static React site that sits in its own Tomcat folder next to Weaver. Weaver stays a separate application at `/weaver/`. This build calls that application on the same host.

The UI used to be copied into Tomcat's `ROOT`, which replaces whatever site is already served at `/`. On a Weaver server that root site has to stay, so this build is installed in a folder you choose instead. **The folder name is the address.** `webapps/spring3/` is served at `/spring3/`. The same works if the folder is named something else, with no second build. Name it `circleweaver` if you want the site at `/circleweaver/` instead, or use any other folder name that fits your server.


In example, the legacy server from this spring3 class:
- UI: https://s07.circleweaver.com/spring3/  (or whatever you would like to name the directory for your build)
- Weaver: https://s07.circleweaver.com/weaver/  (legacy frontend is still there for mainline functionality but redirects can be built in)
- baseURL in WEB-INF/config.txt: https://s07.circleweaver.com/weaver/
- Tomcat UI folder: /opt/tomcat/webapps/spring3/
- Tomcat ROOT: /opt/tomcat/webapps/ROOT/ (leave the existing site here)
- Weaver app: /opt/tomcat/webapps/weaver/
- libFolder: /opt/weaver_sites/
- userFolder: /opt/weaver_user/


## Prerequisites

- Weaver running in Tomcat with context path `/weaver/`.
- Node.js 20.19 or newer, or 22.12 or newer. Check with `node -v`.
- npm, which comes with Node.

## Local UI Development (Vite Live Reload)

When working on the React UI, use Vite's development server rather than previewing through Tomcat.

**Important:** Tomcat serves the built files from `dist`, not the original source files in `spring3/src`. This means that editing a source file and refreshing a Tomcat preview will not show your changes until you build the app again and copy the updated files over.

### 1. Start the development server

From the repository root, run:

```bash
cd spring3
npm ci
npm run dev
```

- `npm ci` installs the project dependencies. You only need to run this the first time, or when dependencies need to be reinstalled.
- `npm run dev` starts Vite's development server.

### 2. Open the local preview

Vite will print a local URL in your terminal. It will usually look something like:

`http://localhost:5173/`

Open that URL in your browser.

### 3. Make your changes

Edit the files under `spring3/src`.

Vite automatically detects changes and updates the page through **Hot Module Replacement (HMR)**. In most cases, you won't even need to refresh your browser.

**Keep in mind:**
- Changes to `spring3/src` appear in the Vite preview, not automatically in Tomcat.
- If you're viewing an older `dist` build through Tomcat, refreshing the page will not update it.
- Avoid editing files directly inside `dist/assets/`. Those files are generated during the build and will be replaced the next time you run it.

---

## Building the UI

When you're ready to create an updated version of the UI for Tomcat, you need to build the project.

From the repository root, run:

```bash
cd spring3
npm ci
npm run build
```

This generates the production-ready site files in:

`spring3/dist/`

**The `dist` folder is generated automatically and is not committed to the repository.**

These are the files you'll copy into your Tomcat webapp folder when updating the deployed preview.

## Install on Tomcat

Copy the contents of `spring3/dist` into a new Tomcat webapp folder, for example `webapps/spring3/`, so `index.html` is served at `/spring3/`. Any other folder name works with this same build — for website URL purposes you can use `webapps/circleweaver/` and open `/circleweaver/` instead. Leave `webapps/ROOT/` alone so the existing site stays up, and leave `webapps/weaver/` alone.

Do not copy `dist` into the Weaver folder. Images and `/assets/` load from the folder you copied into. API calls stay on the host at `/weaver/auth/query` and `/weaver/v/session.json`.

Open that folder, for example `http://localhost:8080/spring3/` (or `http://localhost:8080/circleweaver/` if you used that name), and sign in. Login uses the identity provider already set in Weaver's `WEB-INF/config.txt`. `baseURL` in that file should be the public Weaver address, ending in `/weaver/`.

`dist` includes a small Tomcat config so a direct visit to a client route such as `/spring3/discussions` still loads the app. That config only applies when the copy is its own webapp, which is the layout above.

## Updating a Tomcat preview after you edit

If you are previewing through Tomcat instead of Vite, you will not get instantaneous changes. After you edit source:

1. `cd spring3`
2. `npm run build`
3. Copy the contents of `spring3/dist` into your Tomcat webapp folder again
4. Hard-refresh the browser (`Ctrl+Shift+R`) in case it is caching the old JS bundle

## Weaver / backend integration

This UI is the frontend only. Sign-in, session, and workspace data come from Weaver on the same host:

- Auth probe: `/weaver/auth/query`
- Session: `/weaver/v/session.json`
- Identity provider and `baseURL` are configured in Weaver's `WEB-INF/config.txt`, not in this React app
- MongoDB (and the rest of Weaver startup) must succeed, or login will not use the provider you set and the UI will look unsigned-in even when the React build is fine

Keep Weaver at `/weaver/`. Keep this UI in its own folder. Do not nest the Spring 3 build inside the Weaver WAR or replace `webapps/ROOT/` with it.
