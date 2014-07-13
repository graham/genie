/*
Copyright [2014] [Graham Abbott <graham.abbott@gmail.com>]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
            
	    try {
		this.cookies[key] = JSON.parse(value);
	    } catch (e) {
		this.cookies[key] = value;
	    }
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
    return window.location.hash.slice(1).split('?')[0];
};

function set_hash(hash) {
    window.location.hash = hash;
}

var Args = function() {
    this.hash = '';
    this.l = {};
    this.load();
};

Args.prototype.load = function() {
    var search = document.location.search;
    if (document.location.hash.indexOf("?") != -1) {
        this.hash = document.location.hash.split('?')[0];
        search = document.location.hash.split('?')[1];
    } else {
        this.hash = get_hash();
    }

    var raw = search.slice(1);
    var rs = raw.split('&');
    var d = {};
    for( var i = 0; i < rs.length; i++ ) {
	var tmp = rs[i].split('=');
	d[tmp[0]] = tmp[1];
    }
    this.l = d;
};

Args.prototype.get_hash = function() {
    return get_hash();
};

Args.prototype.set_hash = function(key) {
    window.location.hash = key;
}

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
