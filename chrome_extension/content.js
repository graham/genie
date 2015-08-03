(function() {
    function insertAtCaret(txtarea, text) {
        var scrollPos = txtarea.scrollTop;
        var caretPos = txtarea.selectionStart;
        var activeType = txtarea.type || txtarea.tagName;

        if (activeType == 'textarea' || activeType == 'text') {
            var front = (txtarea.value).substring(0, caretPos);
            var back = (txtarea.value).substring(txtarea.selectionEnd, txtarea.value.length);
            txtarea.value = front + text + back;
        } else if (activeType == 'DIV') {
            var front = (txtarea.innerText).substring(0, caretPos);
            var back = (txtarea.innerText).substring(txtarea.selectionEnd, txtarea.innerText.length);
            txtarea.innerText = front + text + back;
        }
        caretPos = caretPos + text.length;
        txtarea.selectionStart = caretPos;
        txtarea.selectionEnd = caretPos;
        txtarea.focus();
        txtarea.scrollTop = scrollPos;
    }
    
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
    var reset = "animation : none;animation-delay : 0;animation-direction : normal;animation-duration : 0;animation-fill-mode : none;animation-iteration-count : 1;animation-name : none;animation-play-state : running;animation-timing-function : ease;backface-visibility : visible;background : 0;background-attachment : scroll;background-clip : border-box;background-color : transparent;background-image : none;background-origin : padding-box;background-position : 0 0;background-position-x : 0;background-position-y : 0;background-repeat : repeat;background-size : auto auto;border : 0;border-style : none;border-width : medium;border-color : inherit;border-bottom : 0;border-bottom-color : inherit;border-bottom-left-radius : 0;border-bottom-right-radius : 0;border-bottom-style : none;border-bottom-width : medium;border-collapse : separate;border-image : none;border-left : 0;border-left-color : inherit;border-left-style : none;border-left-width : medium;border-radius : 0;border-right : 0;border-right-color : inherit;border-right-style : none;border-right-width : medium;border-spacing : 0;border-top : 0;border-top-color : inherit;border-top-left-radius : 0;border-top-right-radius : 0;border-top-style : none;border-top-width : medium;bottom : auto;box-shadow : none;box-sizing : content-box;caption-side : top;clear : none;clip : auto;color : inherit;columns : auto;column-count : auto;column-fill : balance;column-gap : normal;column-rule : medium none currentColor;column-rule-color : currentColor;column-rule-style : none;column-rule-width : none;column-span : 1;column-width : auto;content : normal;counter-increment : none;counter-reset : none;cursor : auto;direction : ltr;display : inline;empty-cells : show;float : none;font : normal;font-family : inherit;font-size : medium;font-style : normal;font-variant : normal;font-weight : normal;height : auto;hyphens : none;left : auto;letter-spacing : normal;line-height : normal;list-style : none;list-style-image : none;list-style-position : outside;list-style-type : disc;margin : 0;margin-bottom : 0;margin-left : 0;margin-right : 0;margin-top : 0;max-height : none;max-width : none;min-height : 0;min-width : 0;opacity : 1;orphans : 0;outline : 0;outline-color : invert;outline-style : none;outline-width : medium;overflow : visible;overflow-x : visible;overflow-y : visible;padding : 0;padding-bottom : 0;padding-left : 0;padding-right : 0;padding-top : 0;page-break-after : auto;page-break-before : auto;page-break-inside : auto;perspective : none;perspective-origin : 50% 50%;position : static;/* May need to alter quotes for different locales (e.g fr) */quotes : '\201C' '\201D' '\2018' '\2019';right : auto;tab-size : 8;table-layout : auto;text-align : inherit;text-align-last : auto;text-decoration : none;text-decoration-color : inherit;text-decoration-line : none;text-decoration-style : solid;text-indent : 0;text-shadow : none;text-transform : none;top : auto;transform : none;transform-style : flat;transition : none;transition-delay : 0s;transition-duration : 0s;transition-property : none;transition-timing-function : ease;unicode-bidi : normal;vertical-align : baseline;visibility : visible;white-space : normal;widows : 0;width : auto; word-spacing : normal;z-index : auto;";
    var style = reset + 'margin:0px; padding:0x; position: fixed; top: 20%; width: 60%; left: 20%; font-family: serif; margin:auto; background-color: white; border: 1px solid rgba(0,0,0,0.22);z-index:100000000000000;';
    var row_style = reset + 'padding:0px; margin:0px; font-size: 14px; font-family: lato; padding: 4px; padding-left: 10px; border-top: 1px solid rgba(0,0,0,0.1);';
    var waiting_on_result = false;
    
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.command == 'show-omni-bar') {
                if (singleton != null) {
                    //singleton[1].focus();
                    remove_from_page();
                } else {
                    previous_focus = document.activeElement;
                    console.log("Previous: " + previous_focus);
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
                var activeType = document.activeElement.type || document.activeElement.tagName;

                if (activeType == undefined) {
                    alert("No active editable, passing.");
                } else if (activeType == 'textarea' || activeType == 'text') {
                    var value = document.activeElement.value;
                    chrome.runtime.sendMessage({command:"render-as-template",
                                                content: value},
                                               function(response) {});
                } else if (activeType == 'INPUT') {
                    var value = document.activeElement.innerText;
                    chrome.runtime.sendMessage({command:"render-as-template",
                                                content: value},
                                               function(response) {});
                } else {
                    alert("You should handle the type: " + activeType);
                }
            } else if (request.command == 'replace-active-content-with') {
                var target = previous_focus || document.activeElement;
                var activeType = target.type || target.tagName;

                if (activeType == undefined) {
                    alert("No active editable, passing.");
                } else if (activeType == 'textarea' || activeType == 'text') {
                    if (request.full_replace) {
                        target.value = request.content;
                    } else {
                        insertAtCaret(target, request.content);
                    }
                } else if (activeType == 'DIV') {
                    if (request.full_replace) {
                        target.innerText = request.content;
                    } else {
                        insertAtCaret(target, request.content);
                    }
                } else {
                    alert("You should handle the type: " + activeType);
                }
            }
        }
    );
    console.log("this got called too");
})();

