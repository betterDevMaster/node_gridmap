var sendQueData = ''
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
    if (data.mail) {
        console.log('mail : ', data)
        self.WebConn.send(JSON.stringify(data));
    }

    if(typeof(data)=='object'&&data.id) {
        //self.sendQueue[data.id] = {data:data, stamp: moment().format('x')};
        var x = {};
        x[data.id] = {data:data, stamp: moment().format('x')};
        window.localStorage.pushQueue(x);
        self.SendData();
    }
}

MyWebSocket.prototype.SendData = function() {
    var self = this;

    var queue = window.localStorage.getFromQueue(10);

    for(var x in queue) {
        if(self.isOpen()) {
            queue[x].data.userName = localStorage.getItem('userName')
            // console.log('sendData: ----- ', queue[x].data, _mySquareCount)
            self.WebConn.send(JSON.stringify(queue[x].data));
        }
    }
}

MyWebSocket.prototype.Connect = function(WSURL, onOpen, onClose, onError, onMessage) {
    var self = this;

    console.log({Connecting:'Connecting to : '+WSURL});

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

        console.log('Websocket: connection opened.');

        self.WebConn.send(JSON.stringify({method: 'AUTH', session: self.sessionId}));
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
        if(message&&message.data) {
            try {
                var data = JSON.parse(message.data);
                //delete self.sendQueue[data.id];

                window.localStorage.removeFromQueue(data.id)
                // Changed by M
                if(data.selected&&data.myCoords) {
                    markedCoords = []
                    _markedCoords = []
                    _myCoords = []
                    _myCoordsIndex = []
                    _mySquareCount = 0
                    // console.log('message: ', data)
                    data.myCoords.forEach(element => {
                        if (element.userName === localStorage.getItem('userName')) {
                            if (_mySquareCount < 20) {
                                _mySquareCount += 1
                                _myCoordsIndex.push(element.index)
                                _myCoords.push(element.coords)
                                _markedCoords[element.index] = allCoords[element.index]
                                // console.log('onmessage : ', _mySquareCount, element, _myCoords, _myCoordsIndex, _markedCoords)
                            } 
                        }
                        const index = parseInt(element.index)
                        markedCoords[index] = allCoords[index];
                    });

                    // Final form's total cost
                    const discountPercent = _myCoords.length * parseFloat(localStorage.getItem('discount') / 100)
                    const discountLength = _myCoords.length
                    console.log(discountLength, discountPercent)
                    $('#totalcost').val((discountLength - discountPercent).toFixed(2) * 100)
                    $('#landpack').html((discountLength - discountPercent).toFixed(2) * 100)

                    const vet = ((discountLength - discountPercent) / parseFloat(localStorage.getItem('vetRate')) * 100);
                    const usdt = ((discountLength - discountPercent) / parseFloat(localStorage.getItem('usdtRate')) * 100);
                    const eth = ((discountLength - discountPercent) / parseFloat(localStorage.getItem('ethRate')) * 100);
                    $('#vet').html(vet.toFixed(2))
                    $('#usdt').html(usdt.toFixed(2))
                    $('#eth').html(eth.toFixed(2))
                    $('#username').val(localStorage.getItem('userName') ? localStorage.getItem('userName') : '')
                    // Mail account failed
                    if(data.hasOwnProperty('transEmail')) {
                        Toastify({
                            text: "Admin message does not respond. Please contact with Administrator.",
                            duration: 5000,
                            newWindow: true,
                            close: true,
                            gravity: "top", // `top` or `bottom`
                            position: "right", // `left`, `center` or `right`
                            backgroundColor:
                                "#e74c3c",
                            stopOnFocus: true, // Prevents dismissing of toast on hover
                            onClick: function () {}, // Callback after click
                        }).showToast()
                    }
                }

                viewer.forceRedraw()
            } catch(err) {
                console.log({err: err});
            }
        }
    }
}

var socks = new MyWebSocket();

socks.Connect('wss://gridmap-admin.herokuapp.com');

// socks.Connect('ws://127.0.0.1:3000');
