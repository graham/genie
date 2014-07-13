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

var Phos = (function() {
    var noop = function() {};

    var str_trim = function(s) { 
        return s.replace(/^\s+|\s+$/g, "").replace(/^[\n|\r]+|[\n|\r]+$/g, "");
    };
    
    var on_error = function(err) {
        console.log('there is an error');
        console.log(err);
    };
    
    var StorageBackend = function(name) {
        this.db = openDatabase(name, '1.0', 'Description', 10 * 1024 * 1024);
    };

    StorageBackend.prototype.stopdrop = function() {
        this.db.transaction( function(tx) {
            tx.executeSql("drop table kv_store", [], noop, noop);

            tx.executeSql(
                "CREATE TABLE IF NOT EXISTS kv_store (ns varchar(256), uuid varchar(256), key text, value TEXT, synced integer)", 
                [], 
                function(){
                    console.log("Table Created.");
                }, 
                function(){
                    console.log("Table create error.");
                });
        });
    };
    
    StorageBackend.prototype.get = function(ns, record, key, cb) {
        this.db.transaction( function(tx) {
            var handle_result = function(tx2, results) {
                if (results.rows.length == 0) {
                    cb(null);
                } else {
                    cb(results.rows.item(0).value);
                }
            };
            
            tx.executeSql("select value from kv_store where uuid=? AND ns=? AND key=?",
                          [record, ns, key],
                          handle_result,
                          on_error
                          );
        });
    };

    StorageBackend.prototype.get_row = function(ns, record, cb) {
        this.db.transaction( function(tx) {
            var handle_result = function(tx2, results) {
                var kv = {};
                for(var i = 0; i < results.rows.length; i++) {
                    var row = results.rows.item(i);
                    kv[row.key] = row.value;
                }
                cb(kv);
            };
            
            tx.executeSql("select key, value from kv_store where uuid=? AND ns=?",
                          [record, ns],
                          handle_result,
                          on_error
                          );
        });
    };
    
    StorageBackend.prototype.test = function(ns, record, key, cb) {
        this.db.transaction( function(tx) {
            var handle_result = function(tx2, results) {
                if (results.rows.length == 0) {
                    cb(false);
                } else {
                    cb(true);
                }
            };
            
            tx.executeSql("select value from kv_store where uuid=? AND ns=? AND key=?",
                          [record, ns, key],
                          handle_result,
                          on_error
                          );
        });
    };
    
    StorageBackend.prototype.set = function(ns, record, key, value, cb) {
        var sb = this;
        sb.test(ns, record, key, function(exists) {
            if (exists) {
                console.log('set: row already exists.');
                sb.db.transaction( function(tx) {
                    tx.executeSql("update kv_store SET value=?, synced=0 where uuid=? AND ns=? AND key=?"
                                  [value, record, ns, key],
                                  function() { cb(true); },
                                  on_error
                                  );
                    console.log('hrm');
                });
            } else {
                console.log('set: new row!');
                sb.db.transaction( function(tx) {
                    tx.executeSql("insert into kv_store(uuid, ns, key, value, synced) values(?, ?, ?, ?, 0)",
                                  [record, ns, key, value],
                                  function() { cb(true); },
                                  on_error
                                  );
                });
            }
        });
    };

    StorageBackend.prototype.get_rows = function(ns, rows, callback) {
        this.db.transaction( function(tx) {
            var handle_results = function(tx2, rs) {
                var last_row = null;
                var rows = [];
                var current_row = {};

                for (var i=0; i < rs.rows.length; i++) {
                    var row = rs.rows.item(i);
                    if (last_row !== null) {
                        if (last_row.ns != row.ns ||
                            last_row.uuid != row.uuid) {
                            rows.push(current_row);
                            current_row = {};
                        }
                    }
                    
                    current_row[row.key] = row.value;
                    current_row['uuid'] = row.uuid;
                    last_row = row;
                }

                rows.push(current_row);
                callback(rows);
            };

            var orders = ["uuid"];
            var q = "('" + rows.join("', '") + "')";
            tx.executeSql("select uuid, ns, key, value from kv_store where ns=? and uuid in " + q,
                          [ns],
                          handle_results,
                          on_error
                          );
        });
    };

    StorageBackend.prototype.query = function(condition, callback) {
        var ns = condition['ns'];
        var sb = this;
        this.db.transaction( function(tx) {
            var handle_results = function(tx2, rs) {
                var rows = [];
                var results = [];
                for (var i=0; i < rs.rows.length; i++) {
                    results.push(rs.rows.item(i).uuid);
                }
                sb.get_rows(ns, results, callback);
            };

            var orders = ["uuid"];

            tx.executeSql("select uuid from kv_store where ns=? group by uuid order by " + orders.join(', '),
                          [ns],
                          handle_results,
                          on_error
                          );
        });
    };

    return {'Backend':StorageBackend};
})();


var otherfrontend = (function() {
  var set = function(key, value) {};
  var get = function(key) {};
  var getset = function(key, value) {};
  var drop = function(key) {};

  // integers
  var incr = function(key, value) {};

  // lists
  var rpush = function(key, value) {};
  var rpop = function(key) {};

  var lpush = function(key, value) {};
  var lpop = function(key) {};

  var linsert = function(key, index, value) {};
  var llen = function(key) {};
  var lset = function(key, index, value) {};
  var lrange = function(key, start, stop) {};
  var lindex = function(key, index) {};
  
  // string
  var sinsert = function(key, index, str) {};
  var sdelete = function(key, start, stop) {};
  var sappend = function(key, item) {};
  var slen = function(key) {};

  // boolean
  var bset = function(key, tf) {};
  var btoggle = function(key, tf) {};

  // hash
  var hset = function(path, key, value) {};
  var hget = function(path, key) {};
});
