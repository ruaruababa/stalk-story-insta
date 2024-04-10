var s = document.createElement('script');
s.src = chrome.runtime.getURL('script.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener('load', function () {
    chrome.storage.sync.get("settings", function (data) {
        postSettings(data['settings']);
    });
})
chrome.storage.onChanged.addListener(function (data) {
    // set a listener to window to read messages
    postSettings(data['settings']['newValue']);
});

window.addEventListener('ratingShowed', function (event) {
    chrome.runtime.sendMessage({"ratingShowed": true});
});

function postSettings(data) {
    window.postMessage({type: 'settings', data: data}, "*");
}

