/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-290dd570'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-64x64.png",
    "revision": "a2420bd4060e2f9add0ede6494221ae1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "7d2f3041abc18137dcabdb6a3ee5a4ba"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c003ca2d19b469c82e0fbc3be953c2fb"
  }, {
    "url": "maskable-icon-512x512.png",
    "revision": "0fda62ea8196fb17b8868934f0eeec7d"
  }, {
    "url": "logo.svg",
    "revision": "62042ac2448787f677bc7525e7cc54f2"
  }, {
    "url": "index.html",
    "revision": "2e587582dd31b48b3fb59a9827005938"
  }, {
    "url": "favicon.ico",
    "revision": "64c7c4b2051a4110f711d5fb8b62af74"
  }, {
    "url": "apple-touch-icon-180x180.png",
    "revision": "334fffc59d85e569800e0baadc26f40f"
  }, {
    "url": "assets/x-ClkIEPZF.js",
    "revision": null
  }, {
    "url": "assets/users-DG3svnw0.js",
    "revision": null
  }, {
    "url": "assets/user-BnXQZIBH.js",
    "revision": null
  }, {
    "url": "assets/useAdminCrud-Shh6yARW.js",
    "revision": null
  }, {
    "url": "assets/shield-C41tJpbu.js",
    "revision": null
  }, {
    "url": "assets/search-CwwcAjkb.js",
    "revision": null
  }, {
    "url": "assets/refresh-cw-BjI6A1sB.js",
    "revision": null
  }, {
    "url": "assets/recibos-B6ZAnihf.js",
    "revision": null
  }, {
    "url": "assets/plus-B1Y4mYbK.js",
    "revision": null
  }, {
    "url": "assets/phone-9KEfySgT.js",
    "revision": null
  }, {
    "url": "assets/map-pin-CVwlsVkN.js",
    "revision": null
  }, {
    "url": "assets/mail-Bhb8jVqZ.js",
    "revision": null
  }, {
    "url": "assets/log-out-DND9ZrOU.js",
    "revision": null
  }, {
    "url": "assets/lock-C4UaxQ9B.js",
    "revision": null
  }, {
    "url": "assets/layout-dashboard-Ltj8recw.js",
    "revision": null
  }, {
    "url": "assets/index-Djdlgicf.css",
    "revision": null
  }, {
    "url": "assets/index-D_ySnUHs.js",
    "revision": null
  }, {
    "url": "assets/hash-BKPDrTHW.js",
    "revision": null
  }, {
    "url": "assets/file-text-C-odkkm2.js",
    "revision": null
  }, {
    "url": "assets/eye-04k1g7vg.js",
    "revision": null
  }, {
    "url": "assets/credit-card-CuhWHl0C.js",
    "revision": null
  }, {
    "url": "assets/createLucideIcon-DoBwVpt0.js",
    "revision": null
  }, {
    "url": "assets/clock-CTMnCoFa.js",
    "revision": null
  }, {
    "url": "assets/circle-check-big-BtFjJfL8.js",
    "revision": null
  }, {
    "url": "assets/circle-alert-BUqL9fuK.js",
    "revision": null
  }, {
    "url": "assets/chevron-right-cDZq6U7w.js",
    "revision": null
  }, {
    "url": "assets/chevron-left-i709K76t.js",
    "revision": null
  }, {
    "url": "assets/chevron-down-0DfDOj8u.js",
    "revision": null
  }, {
    "url": "assets/check-BflLsg3J.js",
    "revision": null
  }, {
    "url": "assets/building-2-OFo-bIhE.js",
    "revision": null
  }, {
    "url": "assets/bell-BlkIRKQ8.js",
    "revision": null
  }, {
    "url": "assets/UsuariosView-Cgf4hwI2.js",
    "revision": null
  }, {
    "url": "assets/TiposNotificacionView-MfGMTJFP.js",
    "revision": null
  }, {
    "url": "assets/TiposFacturaView-D-RvWN74.js",
    "revision": null
  }, {
    "url": "assets/SplashView-DI22iMq8.css",
    "revision": null
  }, {
    "url": "assets/SplashView-B2nXNBZt.js",
    "revision": null
  }, {
    "url": "assets/RequestPaymentView-D9p800vH.js",
    "revision": null
  }, {
    "url": "assets/RegisterView-BLrd6500.js",
    "revision": null
  }, {
    "url": "assets/RecibosView-BlLLdn9_.js",
    "revision": null
  }, {
    "url": "assets/RecibosView-BK0O1RRk.css",
    "revision": null
  }, {
    "url": "assets/ReciboDetailView-uYCUCPco.js",
    "revision": null
  }, {
    "url": "assets/ProfileView-CMk3Az7k.js",
    "revision": null
  }, {
    "url": "assets/PaymentStatus-0BItG4yW.js",
    "revision": null
  }, {
    "url": "assets/LoginView-B4EN14Vp.js",
    "revision": null
  }, {
    "url": "assets/LandingView-evQ6Vwjk.css",
    "revision": null
  }, {
    "url": "assets/LandingView-80A1ydTy.js",
    "revision": null
  }, {
    "url": "assets/HistoryView-ByTE9mqW.js",
    "revision": null
  }, {
    "url": "assets/EstadosReciboView-B0orhF39.js",
    "revision": null
  }, {
    "url": "assets/EmpresasServicioView-DiDuL7y2.js",
    "revision": null
  }, {
    "url": "assets/EditProfileView-YHFpTmSs.js",
    "revision": null
  }, {
    "url": "assets/DashboardView-RmVIbEFY.js",
    "revision": null
  }, {
    "url": "assets/DashboardView-Bs1sNNgn.js",
    "revision": null
  }, {
    "url": "assets/CrudModal-DpHJQ0aq.js",
    "revision": null
  }, {
    "url": "assets/CrudModal-6tBR4_s3.css",
    "revision": null
  }, {
    "url": "assets/ConfirmationModal-CaTU0aMu.js",
    "revision": null
  }, {
    "url": "assets/ConfirmationModal-BtB83koK.css",
    "revision": null
  }, {
    "url": "assets/ClientesView-Klsj2c1a.js",
    "revision": null
  }, {
    "url": "assets/BottomTabBar-BspLXRAp.js",
    "revision": null
  }, {
    "url": "assets/AppHeader-B17QWZar.js",
    "revision": null
  }, {
    "url": "assets/AppButton-B2tZqHht.js",
    "revision": null
  }, {
    "url": "assets/AdminLoginView-DJoOMEWP.js",
    "revision": null
  }, {
    "url": "assets/AdminLayout-Ye55IZKp.css",
    "revision": null
  }, {
    "url": "assets/AdminLayout-CcOWuIZT.js",
    "revision": null
  }, {
    "url": "assets/AddReciboView-DvbirT_R.js",
    "revision": null
  }, {
    "url": "apple-touch-icon-180x180.png",
    "revision": "334fffc59d85e569800e0baadc26f40f"
  }, {
    "url": "favicon.ico",
    "revision": "64c7c4b2051a4110f711d5fb8b62af74"
  }, {
    "url": "logo.svg",
    "revision": "62042ac2448787f677bc7525e7cc54f2"
  }, {
    "url": "maskable-icon-512x512.png",
    "revision": "0fda62ea8196fb17b8868934f0eeec7d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c003ca2d19b469c82e0fbc3be953c2fb"
  }, {
    "url": "pwa-512x512.png",
    "revision": "7d2f3041abc18137dcabdb6a3ee5a4ba"
  }, {
    "url": "pwa-64x64.png",
    "revision": "a2420bd4060e2f9add0ede6494221ae1"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6d04a6674e04fae947d951d21a5043cb"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^http:\/\/localhost:8080\/api\/.*/i, new workbox.NetworkFirst({
    "cacheName": "api-cache",
    "networkTimeoutSeconds": 10,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 86400
    })]
  }), 'GET');

}));
