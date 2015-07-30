var last = null;
var genie_env = new genie.Environment();

function update_status() {
    if (items_to_sync.length > 0) {
        chrome.browserAction.setBadgeText({text: "" + items_to_sync.length});
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.command == 'render-as-template') {
            var result = genie.fs(request.content, {"engine":"Genie 0.5"});
            chrome.tabs.query({currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command:"replace-active-content-with",
                                                     content:result}, function(response) {
                    console.log("sent a result to the main window.");
                });
            });
        } else if (request.command == 'render-active-with-template') {
            var result = genie_env.render(request.template_name, {});
            chrome.tabs.query({currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command:"replace-active-content-with",
                                                     content:result}, function(response) {
                    console.log("sent a result to the main window.");
                });
            });
        } else {
            var url = "http://github.com/graham/genie";
            chrome.tabs.create({ active:false, url: url });
            sendResponse({response:"done"});
        }
    });

(function() {
	chrome.commands.onCommand.addListener(function(command) {
        if (command == "render-focused-editable") {
            chrome.tabs.query({currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command: "request-active-content"}, function(response) {
                    console.log("requested content.");
                });
            });
        } else if (command == "open-drawer") {
            chrome.tabs.query({currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command: "show-omni-bar"}, function(response) {
                    console.log("Requested Omni bar show for tab: " + tabs[0]);
                });
            });
        }
	});	
})();

console.log("Loaded internal");
