/* ------- StringBuffer ------- */
function StringBuffer() {
    this.temp = [];
}

StringBuffer.prototype.append = function(text) {
    this.temp.push(text);
    return this;
};

StringBuffer.prototype.toString = function() {
    return this.temp.join("");
};


/* ------- Set ------- */

function Set() {
    this.temp = [];
}


Set.prototype.add = function(text) {
    if (this.temp.join(",").indexOf(text) == -1) {
        this.temp.push(text);
        return true;
    }
    return false;
};

Set.prototype.toArray = function() {
    return this.temp;
};

Set.prototype.size = function() {
    return this.temp.length;
};

Set.prototype.toString = function() {
    return this.temp.join(",");
};

/* ------- Map ------- */

function Map() {
    this.temp = [];
}

Map.prototype.put = function(key, value) {

    for (var i = 0; i < this.temp.length; i++) {
        if (this.temp[i].key == key) {
            this.temp[i].value = value;
            return;
        }
    }

    this.temp.push({'key':key,'value':value});

};

Map.prototype.get = function(key) {

    for (var i = 0; i < this.temp.length; i++) {
        if (this.temp[i].key == key) {
            return this.temp[i].value;
        }
    }

    return null;
};

Map.prototype.keys = function() {
    var keys = [];
    for (var i = 0; i < this.temp.length; i++) {
        keys.push(this.temp[i].key);
    }
    return keys;
};

Map.prototype.values = function() {
    var values = [];
    for (var i = 0; i < this.temp.length; i++) {
        values.push(this.temp[i].value);
    }


    return values;
};

Map.prototype.remove = function(key) {
    var newTemp = [];
    for (var i = 0; i < this.temp.length; i++) {
        if (this.temp[i].key != key) {
            newTemp.push(this.temp[i]);
        }
    }
    this.temp = newTemp;
};


Map.prototype.firstNote = function() {
    if (this.temp.length == 0) {
        return undefined;
    }
    return this.temp[0].value;
};


Map.prototype.size = function() {
    return this.temp.length;
};
