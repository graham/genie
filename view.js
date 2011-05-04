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