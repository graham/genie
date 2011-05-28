var Gett = function(url, data) {
    this.url = url;
    this.data = data;
};

Gett.prototype.init = function() {
    this.request = new XMLHttpRequest();
};

Gett.prototype.get = function(data) {

};