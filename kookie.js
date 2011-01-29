var Kookie = function() {
    this.load();
};

Kookie.prototype.load = function() {
    var t = document.cookie.split(';');
    this.cookies = {}
    
    if (document.cookie) {
        for( var i=0; i < t.length; i++ ) {
            var key = t[i].split('=')[0];
            var value = t[i].split('=')[1];
            
            if (key[0] == ' ') {
                key = key.substring(1);
            }
            
            this.cookies[key] = value;
        }
    }
};

Kookie.prototype.render = function() {
    var s = [];
    for( var i in this.cookies ) {
        s.push( i + '=' + this.cookies[i] );
    }
    return s;
};

Kookie.prototype.get = function(key, def) {
    var value = this.cookies[key];
    if (value === undefined && def !== undefined) {
        return def;
    } else {
        return value;
    }
};

Kookie.prototype.set = function(key, data) { 
    this.cookies[key] = data;
};

Kookie.prototype.append = function(key, data) {
    var prev = this.cookies[key];
    if (prev === undefined) {
        this.cookies[key] = JSON.stringify([data]);
    } else {
        var d = JSON.parse( this.cookies[key] );
        d.push(data);
        this.cookies[key] = JSON.stringify(d);
    }
};

Kookie.prototype.lpop = function(key) {
    var d = JSON.parse(this.get(key, false));
    if (d) {
        this.set(key, JSON.stringify(d.slice(1)));
        return d.slice(0, 1);
    } else {
        return undefined;
    }
};

Kookie.prototype.rpop = function(key) {
    var d = JSON.parse(this.get(key, false));
    if (d) {
        this.set(key, JSON.stringify(d.slice(0, d.length-1)));
        return d.slice(d.length-1, d.length);
    } else {
        return undefined;
    }
};

Kookie.prototype.drop = function(key) {
    this.cookies[key] = ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
};

Kookie.prototype.flush = function() {
    var c = this.render();
    // this is so fucked.

    for( var i=0; i < c.length; i++ ) {
        document.cookie = c[i];
    }
    this.load();
};

Kookie.prototype.keys = function() {
    var s = [];
    for( var i in this.cookies ) {
        s.push(i);
    }
    return s;
};

function get_hash() {
    return window.location.hash.slice(1);
};

var Args = function() {
    this.l = {};
    this.load();
};

Args.prototype.load = function() {
    var raw = document.location.search.slice(1);
    var rs = raw.split('&');
    var d = {};
    for( var i = 0; i < rs.length; i++ ) {
	var tmp = rs[i].split('=');
	d[tmp[0]] = tmp[1];
    }
    this.l = d;
};

Args.prototype.get = function(key, def) {
    var value = this.l[key];
    if (value === undefined && def !== undefined) {
        return def;
    } else {
        return value;
    }
};

Args.prototype.parse = function(key, def) {
    var value = this.get(key);
    if (key) {
	return JSON.parse(value);
    } else {
	return def;
    }
};