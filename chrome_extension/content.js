(function() {
    var singleton = null;
    var remove_from_page = function() {
        setTimeout(function() {
            if (singleton) {
                document.body.removeChild(singleton[0]);
                singleton = null;
                if (previous_focus) {
                    setTimeout(function() {
                        previous_focus.focus();
                        previous_focus = null;
                    }, 1);
                }
            }
        }, 1);
    };

    var previous_focus = null;
    
    var style = 'position: fixed; top: 20%; width: 60%; left: 20%; font-family: serif; margin:auto; background-color: rgba(222, 255, 222, 0.8);'
    
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.command == 'show-omni-bar') {
                if (singleton != null) {
                    //singleton[1].focus();
                    remove_from_page();
                } else {
                    previous_focus = document.activeElement;
                    var d = document.createElement('div');
                    var form = document.createElement('form');
                    var input = document.createElement('input');
                    var ul = document.createElement('div');
                
                    input.style.cssText = "width: 100%; padding: 20px; font-size:40px;background:transparent;outline:none;border:0;";
                    input.type = 'textfield';
                
                    d.appendChild(form);
                    form.appendChild(input);
                
                    d.style.cssText = style;
                    d.appendChild(ul);
                    document.body.appendChild(d);
                
                    form.onsubmit = remove_from_page;
                    input.onblur = remove_from_page;

                    input.onkeyup = function() {
                        chrome.runtime.sendMessage({command:"quick-search",
                                                    query:input.value},
                                                   function(response) {
                            console.log(response);
                            ul.innerHTML = '';
                            for(var i = 0; i < response.results.length; i++) {
                                var obj = response.results[i];
                                var ii = document.createElement('div');
                                ii.innerHTML = obj;
                                ul.appendChild(ii);
                            }
                        });
                    };

                    singleton = [d, input];
                
                    setTimeout(function() {
                        input.focus();
                    }, 1);
                }
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

