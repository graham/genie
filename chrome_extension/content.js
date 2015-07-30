(function() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log(request);
            if (request.command == 'show-omni-bar') {
                
            } else if (request.command == 'request-active-content') {
                var activeType = document.activeElement.type;

                if (activeType == undefined) {
                    alert("No active editable, passing.");
                } else if (activeType == 'textarea') {
                    var value = document.activeElement.value;
                    chrome.runtime.sendMessage({command:"render-as-template",
                                                content: value},
                                               function(response) {});
                } else {
                    alert("You should handle the type: " + activeType);
                }
            } else if (request.command == 'replace-active-content-with') {
                var activeType = document.activeElement.type;

                if (activeType == undefined) {
                    alert("No active editable, passing.");
                } else if (activeType == 'textarea') {
                    document.activeElement.value = request.content;
                } else {
                    alert("You should handle the type: " + activeType);
                }
            }
        }
    );
    console.log("this got called too");
})();

