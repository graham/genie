var client = null;

function build_client() {
    var app_key = 'xo5pqa0rdvwpzh1';
    client = new Dropbox.Client({key: app_key});
    client.authDriver(new Dropbox.AuthDriver.ChromeExtension({
        receiverPath: "helper/chrome_oauth_receiver.html"}));

    client.authenticate(function(error, client) {
        if (error) {
            // Replace with a call to your own error-handling code.
            //
            // Don't forget to return from the callback, so you don't execute the code
            // that assumes everything went well.
            console.log(error);
        }

        // Replace with a call to your own application code.
        //
        // The user authorized your app, and everything went well.
        // client is a Dropbox.Client instance that you can use to make API calls.
        progress_forward(client);
    });
}

build_client();

function path_to_name(path) {
    var sp = path.split('/');
    var filename = sp[sp.length-1];
    var name = filename.split('.')[0].replace(/ /gi, '_');
    return name;
}

function progress_forward(client) {
    var config = client.readFile('/config.json', function() {
        $("#config").html(config.response);
    });

    var files = client.readdir('/templates/', function() {
        var data = JSON.parse(files.response);
        var paths = [];
        for(var i = 0; i < data.contents.length; i++) {
            var path = data.contents[i].path;
            paths.push(path);
            
            var tr = document.createElement('tr');
            var name = path_to_name(path);
            tr.innerHTML = "<td>" + path + "</td><td>" + name + "<td id='status_" + name + "'>syncing</td>";
            $("#thelist").append(tr);
        }

        for(var i = 0; i < paths.length; i++) {
            var path = paths[i];
            var name = path_to_name(path);

            (function(n, p) {
                var file = client.readFile(p, function() {
                    var data = file.response;
                    chrome.runtime.sendMessage({"command":"create-or-update-template",
                                                "name":n,
                                                "data":data}, function() {
                        console.log("Done: " + [n, p, data]);
                        $("#status_" + n).html("done.");
                    });
                });
            })(name, path);
        }
    });
}
