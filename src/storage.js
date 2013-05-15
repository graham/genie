var storage_engine = (function() {

    if (typeof(Storage) == "undefined") {
        return null;
    }

    var StorageEngine = function(prefix, is_session) {
        this.prefix = prefix || '';
        this.is_session = is_session || false;
        
        if (this.is_session) { 
            this.storage = sessionStorage;
        } else {
            this.storage = localStorage;
        }

    };

    StorageEngine.prototype.set = function(key, value) {
        if (this.prefix) {
            return this.storage.setItem(this.prefix + '.' + key, value);
        } else {
            return this.storage.setItem(key, value);
        }
    };

    StorageEngine.prototype.get = function(key) {
        if (this.prefix) {
            return this.storage.getItem(this.prefix + '.' + key);
        } else {
            return this.storage.getItem(key);
        }
    };

    StorageEngine.prototype.drop = function(key) {
        if (this.prefix) {
            var value = this.get(this.prefix + '.' + key);
            this.storage.removeItem(this.prefix + '.' + key);
            return value;
        } else {
            var value = this.get(key);
            this.storage.removeItem(key);
            return value;
        }
    };

    StorageEngine.prototype.update = function(key, newd) {
        var target = JSON.parse(this.get(key));
        for(var k in newd) {
            var obj = newd[k];
            target[k] = obj;
        }
        this.set(key, JSON.stringify(target));
    };        

    StorageEngine.prototype.cache = function(key, cb) {
        if (this.get(key) === null) {
            this.resolve_cache_miss(key, cb);
        } else {
            cb(this.get(key));
        }
    };

    StorageEngine.prototype.resolve_cache_miss = function(key, cb) {
        console.log('Cache miss: ' + key);
        var se = this;
        $.get(key, function(data) {
            se.set(key, data);
            cb(data);
        });
    };

    StorageEngine.prototype.clear = function() {
        if (this.prefix) {
            for( var i in this.storage ) {
                if (i.slice(0, this.prefix.length) == this.prefix) {
                    this.drop(i.slice(this.prefix.length+1));
                }
            }
        } else {
            this.storage.clear();
        }
    };

    StorageEngine.prototype.keys = function() {
        var l = [];
        for (var i in this.storage) {
            if (i.slice(0, this.prefix.length) == this.prefix) {
                l.push(i.slice(this.prefix.length+1));
            }
        }
        return l;
    };

    var Cache = function() {
        this.storage = new StorageEngine('rando_cache');
    };

    Cache.prototype.load = function(key, init_cb, final_cb) {
        var cache = this;
        var hit = this.storage.get(key);
        if (hit == null) {
            console.log(hit);
            init_cb(function(data) {
                cache.storage.set(key, JSON.stringify(data));
                final_cb(data);
            });
        } else {
            final_cb(JSON.parse(hit));
        }
    };

    return {'StorageEngine':StorageEngine, 'Cache':Cache};
})();
