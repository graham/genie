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
    var style = 'margin:0px; padding:0x; position: fixed; top: 20%; width: 60%; left: 20%; font-family: serif; margin:auto; background-color: white; border: 1px solid rgba(0,0,0,0.22);';
    var row_style = 'padding:0px; margin:0px; font-size: 14px; font-family: lato; padding: 4px; padding-left: 10px; border-top: 1px solid rgba(0,0,0,0.1);';
    var waiting_on_result = false;
    
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
                
                    input.style.cssText = "width: 100%; padding: 20px; font-size:50px !important;background:transparent;outline:none;border:0; font-family: lato !important;margin:0px;";
                    input.type = 'textfield';
                
                    d.appendChild(form);
                    form.appendChild(input);
                
                    d.style.cssText = style;
                    d.appendChild(ul);
                    document.body.appendChild(d);
                
                    var formsubmit = function() {
                        waiting_on_result = true;
                        chrome.runtime.sendMessage({command:"render-active-with-template",
                                                    template_name:input.value},
                                                   function(response) {
                            if (response.error) {
                                ul.innerHTML = '';
                                var ii = document.createElement('div');
                                ii.innerHTML = response.error;
                                ii.style.cssText=row_style + " background-color: rgba(255, 0, 0, 0.1);";
                                ul.appendChild(ii);
                            } else if (response.results) {
                                ul.innerHTML = '';
                                for(var i = 0; i < response.results.length; i++) {
                                    var obj = response.results[i];
                                    var ii = document.createElement('div');
                                    ii.innerHTML = obj;
                                    ii.style.cssText=row_style;
                                    ul.appendChild(ii);
                                }
                            } else {
                                remove_from_page();
                            }
                            setTimeout(function() {
                                waiting_on_result = false;
                            }, 100);
                        });
                        return false;
                    }
                    form.onsubmit = function() { return false; };
                    
                    input.onblur = remove_from_page;
                    input.onkeydown = function(event) {
                        if (event.keyCode == 13) {
                            formsubmit();
                            return false;
                        }
                    };
                    input.onkeyup = function(event) {
                        if (event.keyCode == 13) {
                            return false;
                        } else {
                            var held_input = input.value;
                            chrome.runtime.sendMessage({command:"quick-search",
                                                        query:held_input},
                                                       function(response) {
                                if (!waiting_on_result) {
                                    ul.innerHTML = '';
                                    for(var i = 0; i < response.results.length; i++) {
                                        var obj = response.results[i];
                                        var ii = document.createElement('div');
                                        ii.innerHTML = obj;
                                        ii.style.cssText=row_style;
                                        ul.appendChild(ii);
                                    }
                                }
                            })
                            return true;
                        }
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
                var target = previous_focus || document.activeElement;
                var activeType = target.type;

                if (activeType == undefined) {
                    alert("No active editable, passing.");
                } else if (activeType == 'textarea') {
                    target.value = request.content;
                } else {
                    alert("You should handle the type: " + activeType);
                }
            }
        }
    );
    console.log("this got called too");
})();

