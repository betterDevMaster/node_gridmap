
Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}

Storage.prototype.getQueue = function() {
    return JSON.parse(this.getItem('sendQueue'))
}

Storage.prototype.resetQueue = function() {
    return this.setItem('sendQueue', JSON.stringify({}))
}

Storage.prototype.setQueue = function(obj) {
    var queue;

    try {
        queue = JSON.parse(this.getItem('sendQueue'));
    } catch(err) {
        console.log(err);
    }

    if(queue) {
        try {
            for(var x in obj) {
                if(obj[x].data) {
                    queue[x] = obj[x];
                }
            }
        } catch(err) {
            console.log(err);
        }
    } else {
        queue = obj;
    }

    return this.setItem('sendQueue', JSON.stringify(queue))
}

Storage.prototype.pushQueue = function(obj) {
    var queue;

    try {
        queue = JSON.parse(this.getItem('sendQueue'))
    } catch(err) {
        console.log(err);
    }

    if(!queue) {
        queue = {}
    }

    for(var x in obj) {
        queue[x] = obj[x];
    }

    // console.log({queue: queue});

    return this.setItem('sendQueue', JSON.stringify(queue));
}

Storage.prototype.removeFromQueue = function(key) {
    var queue;

    try {
        queue = JSON.parse(this.getItem('sendQueue'));
    } catch(err) {
        console.log(err);
    }

    if(queue) {
        if(queue[key]) {
            delete queue[key];
        }

        return this.setItem('sendQueue', JSON.stringify(queue))
    }

    return false;
}

Storage.prototype.getFromQueue = function(count) {
    var queue;

    if(count&&parseInt(count)>0) {
    } else {
        count = 1;
    }

    try {
        queue = JSON.parse(this.getItem('sendQueue'));
    } catch(err) {
        console.log(err);
    }

    var ret = {}

    var ctr = 0;

    if(queue) {

        for(var x in queue) {
            if(ctr==count) break;

            ret[x] = queue[x];
            ctr++;
        }

        return ret;
    }

    return false;
}

var MyWebSocket = function(){
    var self = this;
    self.sessionId = '%SESSION%';
    self.Connected = false;
    self.sendQueue = {};
}

MyWebSocket.prototype.uuid4 = function() {
    var temp_url = URL.createObjectURL(new Blob());
    var uuid = temp_url.toString();
    URL.revokeObjectURL(temp_url);
    return uuid.split(/[:\/]/g).pop().toLowerCase(); // remove prefixes
}

MyWebSocket.prototype.isOpen = function() { 
    var self = this;

    return self.WebConn.readyState === self.WebConn.OPEN 
}

MyWebSocket.prototype.Send = function(data) {
    var self = this;
    // console.log('MyWebSocket send : --------- ', data)
    if(typeof(data)=='object'&&data.id) {
        //self.sendQueue[data.id] = {data:data, stamp: moment().format('x')};
        var x = {};
        x[data.id] = {data:data, stamp: moment().format('x')};
        window.localStorage.pushQueue(x);
    }

    //console.log({sendQueue: self.sendQueue});
}

MyWebSocket.prototype.SendData = function() {
    var self = this;

    var queue = window.localStorage.getFromQueue(10);

    for(var x in queue) {
        if(self.isOpen()) {
            self.WebConn.send(JSON.stringify(queue[x].data));
        }
    }

    if(self.isOpen()) {
        setTimeout(function(){
            try {
                self.SendData();
            } catch(err) {
                console.log(err);
            }
        }, 100);
    }
}

MyWebSocket.prototype.SendData2 = function() {
    var self = this;

    var ctr = 0;

    for(var x in self.sendQueue) {
        ctr++;

        if(ctr>10) {
            break;
        }

        var t = {};
        t[x] = self.sendQueue[x];
        console.log(t);

        if(self.isOpen()) {
            self.WebConn.send(JSON.stringify(self.sendQueue[x].data));
        }
    }

    if(self.isOpen()) {
        setTimeout(function(){
            try {
                self.SendData();
            } catch(err) {
                console.log(err);
            }
        }, 5000);
    } else {
        window.localStorage.setQueue(self.sendQueue);
        self.sendQueue = {}
    }
}

MyWebSocket.prototype.Connect = function(WSURL, onOpen, onClose, onError, onMessage) {

    var self = this;

    // console.log({Connecting:'Connecting to '+WSURL});

    // console.log({localStorage: window.localStorage});

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    try {
        self.WebConn = new WebSocket(WSURL);
    } catch(err) {
        self.Connected = false;
        return;
    }

    self.WebConn.binaryType = "arraybuffer";

    self.WSURL = WSURL;

    self.WebConn.onopen = function (e) {
        self.Connected = true;

        // console.log('Websocket: connection opened.');

        self.WebConn.send(JSON.stringify({method: 'AUTH', session: self.sessionId}));

        /*var queue = window.localStorage.getQueue();

        if(queue) {
            for(var x in queue) {
                self.sendQueue[x] = queue[x];
            }
        }

        window.localStorage.resetQueue();*/

        self.SendData();
    }

    self.WebConn.onclose = function(obj) {
        self.Connected = false;

        console.log('Websocket: connection closed.');

        setTimeout(function(){
            if(!self.Connected) {
              self.Connect(self.WSURL);
            }
        }, 1000)
  
    }

    self.WebConn.onerror = function (error) {
        console.log('Websocket: connection error.');
    }

    self.WebConn.onmessage = function (message) {
        // console.log('Websocket: received message.');

        if(message&&message.data) {
            try {
                var data = JSON.parse(message.data);
                //delete self.sendQueue[data.id];
                window.localStorage.removeFromQueue(data.id)

                // Changed by M
                if(data.selected&&data.myCoords) {
                    markedCoords = [];
                    data.myCoords.forEach(element => {
                        const index = parseInt(element.index)
                        markedCoords[index] = allCoords[index];
                    });

                    viewer.forceRedraw()
                }

            } catch(err) {
                console.log({err: err});
            }

        }
        
    }
}

var socks = new MyWebSocket();

// socks.Connect('ws://gridmap.loadpo.com:%WSPORT%');
socks.Connect('ws://127.0.0.1:%WSPORT%');
