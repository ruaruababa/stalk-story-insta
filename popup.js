let settings = {};
getSettings(function (data) {
  settings = data;
});

let enableToggleButton = document.getElementById('enable-toggle');
let enableLabel = document.getElementById('enable-label');
let submitLicenseButton = document.getElementById('submit-license');
let licenseInput = document.getElementById('license-input');
let error = document.getElementById('error');
let subscriptionSection = document.getElementById('subscription-section');
let subscriptionPlanLabel = document.getElementById('subscription-plan-label');
let openInstaSection = document.getElementById('open-insta-section');

let isEnable = true;
let needsSubscription = false;
let isPremium = true;

window.onload = function () {
  getSettings(function (json) {
    settings = json;
    document.getElementById('buy-button').href =
      'https://shop.getghostify.com/checkout/buy/ee7d66e8-6f8c-47c6-97ce-a2214994d5c5?media=0&discount=0&checkout[email]=' +
      settings['email'] +
      '&checkout[custom][user_id]=' +
      settings['id'];
    isEnable =
      settings['enable-toggle'] !== undefined &&
      settings['enable-toggle'] === true;
    if (
      settings['subscribed'] !== undefined &&
      settings['subscribed'] === true
    ) {
      needsSubscription = false;
      isPremium = true;
      updateViewsVisibility();
      checkSubscription();
    } else {
      let installTime = settings['install_time'];
      if (installTime === undefined) {
        chrome.cookies.get(
          { url: 'https://getghostify.com/', name: 'install_time' },
          function (cookie) {
            if (cookie) {
              console.log(
                'read install_time from cookie (user is pedar sookhte)',
                cookie.value
              );
              installTime = Number(cookie.value);
            }
            if (installTime === undefined) {
              installTime = Date.now();
            }
            saveInstallTime(installTime);
            checkInstallTime(installTime);
          }
        );
      } else {
        checkInstallTime(installTime);
      }
    }
  });
};

function checkInstallTime(installTime) {
  needsSubscription =
    Date.now() - installTime > 24 * 60 * 60 * 1000 * 100000000;
  isPremium = true;
  if (isEnable && needsSubscription) {
    isEnable = true;
    enableExtention(true, function () {
      getSettings(function (json) {
        settings = json;
      });
    });
    checkSubscription();
  }
  updateViewsVisibility();
}

licenseInput.addEventListener('input', function () {
  error.textContent = '';
  if (licenseInput.value === '')
    submitLicenseButton.setAttribute('disabled', 'true');
  else submitLicenseButton.removeAttribute('disabled');
});

submitLicenseButton.addEventListener('click', function () {
  if (licenseInput.value === '') return;
  track('submit_license');
  submitLicenseButton.classList.add('is-loading');
  checkSubscription();
});

enableToggleButton.addEventListener('change', function () {
  console.log('enable toggle change');
  if (needsSubscription) {
    this.checked = !this.checked;
    return;
  }
  track('instagram_click');
  isEnable = true;
  enableExtention(true, function () {
    getSettings(function (json) {
      settings = json;
    });
  });
  updateViewsVisibility();
});

function updateViewsVisibility() {
  if (needsSubscription) {
    subscriptionSection.classList.remove('is-hidden');
    openInstaSection.classList.add('is-hidden');
    subscriptionPlanLabel.classList.add('is-hidden');
  } else {
    subscriptionSection.classList.add('is-hidden');
    enableToggleButton.checked = true;
    if (isEnable) {
      enableLabel.textContent = 'Stalk mode is working';
      chrome.tabs.query(
        {
          active: true,
          url: 'https://*.instagram.com/*',
          lastFocusedWindow: true,
        },
        function (tabs) {
          if (tabs.length) openInstaSection.classList.add('is-hidden');
          else openInstaSection.classList.remove('is-hidden');
        }
      );
    } else {
      enableLabel.textContent = 'Ghostify is disabled';
      openInstaSection.classList.add('is-hidden');
    }

    subscriptionPlanLabel.classList.remove('is-hidden');
    if (isPremium) {
      //todo you are premium untill ?
      subscriptionPlanLabel.textContent = 'You are using the premium version';
    } else {
      subscriptionPlanLabel.textContent =
        'You are on the 1 day Free Trial plan';
    }
  }
}

function checkSubscription() {
  console.log('Checking sub');
  let body;
  let isLicenseEmpty = licenseInput.value?.trim()?.length === 0;
  if (!isLicenseEmpty) {
    body = { ...settings, ...{ licenseKey: licenseInput.value } };
  } else {
    body = { ...settings };
  }
  checkLicense(body, function (response) {
    response.text().then(function (result) {
      let json = JSON.parse(result);
      console.log(json);
      if (!json.success) {
        error.textContent = 'No subscription found';
        storePrefs([
          { subscribed: json.success, purchased_item: json.purchased_item },
        ]);
        track('purchase_unsuccessful');
        needsSubscription = true;
        isPremium = true;
        updateViewsVisibility();
      } else {
        console.log({ licenseKey: licenseInput.value, subscribed: true });
        if (!isLicenseEmpty) {
          storePrefs([
            { licenseKey: licenseInput.value },
            { subscribed: true },
          ]);
        } else {
          storePrefs([{ subscribed: true }]);
        }
        // track("purchase", {
        //     "value": json.price,
        //     items: [{item_name: json.purchased_item, item_variant: json.recurrence, price: json.price}]
        // });
        needsSubscription = false;
        isPremium = true;
        updateViewsVisibility();
      }
      submitLicenseButton.classList.remove('is-loading');
    });
  });
}
