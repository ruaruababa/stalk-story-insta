try {
  importScripts('utils.js');
} catch (e) {
  console.error(e);
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'check') {
    check();
    saveCookie();
  }
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'toggleIcon') {
    if (msg.active) {
      chrome.action.setIcon({ path: 'icon128.png' });
    } else {
      chrome.action.setIcon({ path: 'icon-gray128.png' });
    }
  }
  return true;
});

// chrome.runtime.onInstalled.addListener((details) => {
//   if (details.reason === chrome.runtime.OnInstalledReason.INSTALL)
//     chrome.tabs.create({ url: 'https://yangdev.tech/' });
//   chrome.alarms.create('check', {
//     periodInMinutes: 720,
//   });
//   saveCookie();
//   delay(500);
//   check();
// });

chrome.runtime.onStartup.addListener(() => {
  enableExtention(false);
  console.log('disable extention for a clean start');
});

function check() {
  chrome.identity.getProfileUserInfo(async function (userInfo) {
    storePrefs([userInfo], function () {
      getSettings(function (settings) {
        if (
          settings['whatsapp'] !== undefined ||
          settings['instagram'] !== undefined
        ) {
          if (settings['whatsapp'] === true || settings['instagram'] === true) {
            chrome.action.setIcon({ path: 'icon128.png' });
          } else {
            chrome.action.setIcon({ path: 'icon-gray128.png' });
          }
        }
        let key = '';
        if (settings['licenseKey'] !== undefined) {
          key = settings['licenseKey'];
        }
        console.log({ ...settings, ...{ licenseKey: key } });
        checkLicense(
          { ...settings, ...{ licenseKey: key } },
          function (response) {
            response.text().then(function (result) {
              let json = JSON.parse(result);
              console.log(json);
              storePrefs([
                {
                  subscribed: json.success,
                  purchased_item: json.purchased_item,
                },
              ]);
            });
          }
        );
      });
    });
  });
}

function saveCookie() {
  chrome.cookies.get(
    { url: 'https://getghostify.com/', name: '_ga' },
    function (cookie) {
      if (cookie) {
        console.log(cookie.value);
        storePrefs([{ _ga: cookie.value }]);
      }
    }
  );
}

chrome.runtime.onMessage.addListener(
  // On Rating showed
  function (request, sender, sendResponse) {
    storePrefs([{ ratingShowed: true }]);
  }
);
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
