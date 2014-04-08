// wtf?

var x_in_list = function(x, the_list) {
    var l = the_list.length;
    for(var i = 0; i < l; i += 1) {
        if (x == the_list[i]) {
            return true;
        }
    }
    return false;
};

var remove_x_from_list = function(x, the_list) {
    var new_list = [];
    for(var i = 0; i < the_list.length; i += 1) {
        if (x != the_list[i]) {
            new_list.push(the_list[i]);
        }
    }
    return new_list;
};

var Razoul = (function() {
    var obs = {};
    var to_remove = [];

    var obs_id = 1;
    var next_id = function() {
        obs_id += 1;
        return obs_id;
    };

    var smart_add = function(name, o) {
        if (obs[name] == undefined) {
            obs[name] = [o];
        } else {
            obs[name].push(o);
        }
    };

    var event_on = function(name, cb) {
        var uid = next_id();
        smart_add(name, [cb, true, uid]);
        return uid;
    };

    var event_once = function(name, cb) {
        var uid = next_id();
        smart_add(name, [cb, false, uid]);
        return uid;
    };

    var event_emit = function(name) {
        if (obs[name] != undefined) {
            var ll = obs[name];
            var args = [obs[2]].concat(arguments); //slice.call(arguments, 1)
            obs[name] = publish_event_to_list(ll, args);
        }

        if (obs['*'] != undefined) {
            var ll = obs['*'];
            var args = [obs[2]].concat(arguments); //slice.call(arguments, 1)
            obs['*'] = publish_event_to_list(ll, args);
        }
    };

    var publish_event_to_list = function(ll, args) {
        var new_list = [];
        var now_final = false;
        
        for(var i = 0; i < ll.length; i += 1) {
            if (x_in_list(ll[i][2], to_remove)) {
                // pass, either it's not a continue, or it's in the remove list.
                to_remove = remove_x_from_list(obj[4], to_remove);
            } else {
                now_final = ll[i][0].apply(null, args);
                if (now_final != false) {
                    if (ll[i][1]) {
                        new_list.push(ll[i]);
                    }    
                }
            }
        }
        return new_list;
    };

    var reset = function() {
        obs = {};
    };

    var remove = function(uid) {
        to_remove.push(uid);
    };

    return {
        'on':event_on, 
        'once':event_once, 
        'emit':event_emit, 
        'reset':reset, 
        'remove':remove
    };

})();

