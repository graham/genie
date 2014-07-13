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

var View = function(data) {
    if (data === undefined) {
	data = [];
    }

    this.data = data;
};

View.prototype.add = function(i) {
    this.data.push(i)
};

View.prototype.remove = function(i) {
    this.data = this.data.filter( function(item) {
	    if (item == i) {
		return false;
	    } else {
		return true;
	    }
	});
};

View.prototype.filter = function(i) {
    return new View(this.data.filter(i));
};

View.prototype.find = function(d) {
    if ( d === undefined ) {
	d = {};
	return new View(this.data);
    }
    
    return new View( this.data.filter( function(item) {
		l = [];
		for(var key in d) {
		    if (key in item) {
			if (d[key] == item[key]) {
			    l.append(true);
			}
                    }
                }
            }));
};

View.prototype.limit = function(count) { 
    return new View(this.data.slice(0, count)); 
};

View.prototype.offset = function(count) { 
    return new View(this.data.slice(count));
};

View.prototype.sort = function(fun) {
    return new View(this.data.sort(fun));
};

View.prototype.each = function(cb) {
    var l = this.data.length;
    for(var i = 0; i < l; i++) {
        cb(this.data[i]);
    }
};

View.prototype.length = function() { 
    return this.data.length;
};

View.prototype.head = function() {
    return this.data[0];
};

View.prototype.tail = function() {
    return new View(this.data.slice(1));
};

View.prototype.toString = function() {
    return "<View: " + this.data + ">";
};

View.prototype.valueOf = function() {
    return this.data;
};

try {
    exports.View = View;
} catch (e) {
    var view = {};
    view.View = View;
}
