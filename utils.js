function storePrefs(arrayOfObject, callback = null) {
    chrome.storage.sync.get('settings', function (data) {
        let settings = data['settings'] !== undefined ? JSON.parse(data['settings']) : {};
        for (const object of arrayOfObject) {
            Object.assign(settings, object);
        }
        data['settings'] = JSON.stringify(settings);
        chrome.storage.sync.set(data, callback);
    });
}

function checkLicense(body, callback) {

    const init = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
        mode: 'no-cors'
    };

    fetch(new Request('https://ext-api.getghostify.com/check'), init).then(callback);
}

function track(name, params = {}) {
    const measurement_id = "G-EYW7F5PNKG";
    const api_secret = "qzcgXJ-ZSN2kxlh3n78ong";

    getSettings(function (data) {
        fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`, {
            method: "POST",
            body: JSON.stringify({
                client_id: data._ga ? data._ga.substr(6) : data.email,
                user_id: data.email,
                events: [{
                    name: name,
                    params: params,
                }]
            })
        });
    });

}

function getSettings(callback) {
    chrome.storage.sync.get('settings', function (data) {
        if (data['settings'] !== undefined) {
            let json = JSON.parse(data['settings']);
            callback(json);
        }
    });
}

function saveInstallTime(installTime) {
    storePrefs([{'install_time': installTime}]);
    chrome.cookies.set({url: 'https://getghostify.com/', name: 'install_time', value: installTime.toString()},
        function (cookie) {
            console.log('install time saved to cookie')
            console.log(cookie)
        });
}

function enableExtention(enable, callback = null) {

    chrome.runtime.sendMessage({
        action: 'toggleIcon',
        active: enable
    });

    if (enable) {
        chrome.tabs.query({url: "https://*.instagram.com/*"}, function (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                chrome.tabs.reload(tabs[i].id);
            }
        });
    }

    storePrefs([{'enable-toggle': enable}], callback);
}