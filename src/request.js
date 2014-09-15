var request = (function() {
    var echo = function(success, data) {
        console.log("no-cb (" + success + "): " + data);
    }

    var parse_result = function(result, callback) {
        var r = JSON.parse(result);
        if (r[0]) {
            callback(1, r.slice(1));
        } else {
            callback(0, r.slice(1));
        }
    };

    var Client = function(data) {
        var d = JSON.parse(data);
        var keys = d[0];
        var routes = d.slice(1, d.length);

        this.routes = routes;
    };

    Client.prototype._call_route = function(route, data, callback) {
        if (callback == undefined) {
            callback = echo;
        }
        return $.ajax({
            url:route[2] + route[4],
            data:data,
            type:route[1]}).done(function(r) {
                parse_result(r, callback);
            }).fail(function(r) {
                callback(-1, r);
            });
    };

    var open_client = function(options, cb) {
        var success = function(data) {
            cb(new Client(data));
        }
        options['success'] = success;
        return $.ajax(options);
    };

    return {'connect':open_client}
})();
