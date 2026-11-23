# Spring 3 UI and Frontend Update (React + Vite in Tomcat)

The Spring 3 UI is a static site that sits in its own Tomcat folder next to Weaver. Weaver stays a separate application at `/weaver/`. This build calls that application on the same host.

The UI used to be copied into Tomcat's `ROOT`, which replaces whatever site is already served at `/`. On a Weaver server that root site has to stay, so this build is installed in a folder you choose instead. The folder name is the address. `webapps/spring3/` is served at `/spring3/`. The same `dist` works if the folder is named something else, with no second build. Name it `circleweaver` if you want the site at `/circleweaver/`, or use any other name.

<!--
In example, this server:
- UI: https://s07.circleweaver.com/spring3/
- Or, with the folder named circleweaver: https://s07.circleweaver.com/circleweaver/
- Weaver: https://s07.circleweaver.com/weaver/
- baseURL in WEB-INF/config.txt: https://s07.circleweaver.com/weaver/
- Tomcat UI folder: /opt/tomcat/webapps/spring3/
- Tomcat ROOT: /opt/tomcat/webapps/ROOT/ (leave the existing site here)
- Weaver app: /opt/tomcat/webapps/weaver/
- libFolder: /opt/weaver_sites/
- userFolder: /opt/weaver_user/
-->

## Prerequisites

- Weaver running in Tomcat with context path `/weaver/`. The UI does not get copied into that app.
- Node.js 20.19 or newer, or 22.12 or newer. Check with `node -v`.
- npm, which comes with Node.

## Build

From the repository root, install dependencies and build the static files:

    cd spring3
    npm ci
    npm run build

The site files are in `spring3/dist`. That folder is not committed. Build once. You do not rebuild to change the Tomcat folder name.

## Install on Tomcat

Copy the contents of `spring3/dist` into a new Tomcat webapp folder, for example `webapps/spring3/`, so `index.html` is served at `/spring3/`. Any other folder name works with this same build. Name the folder `circleweaver` if you want the site at `/circleweaver/` for the public address, or pick another name. Leave `webapps/ROOT/` alone so the existing site stays up, and leave `webapps/weaver/` alone.

Do not copy `dist` into the Weaver folder. Images and `/assets/` load from the folder you copied into. API calls stay on the host at `/weaver/auth/query` and `/weaver/v/session.json`.

Open that folder, for example `http://localhost:8080/spring3/` or `http://localhost:8080/circleweaver/`, and sign in. Login uses the identity provider already set in Weaver's `WEB-INF/config.txt`. `baseURL` in that file should be the public Weaver address, ending in `/weaver/`.

`dist` includes a small Tomcat config so a direct visit to a client route such as `/spring3/discussions` still loads the app. That config only applies when the copy is its own webapp, which is the layout above.
