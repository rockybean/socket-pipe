// Generated by CoffeeScript 1.10.0
(function() {
  var Net;

  Net = require('net');

  module.exports = (function() {
    function _Class(localAddress, remoteAddress) {
      this.localAddress = localAddress;
      this.remoteAddress = remoteAddress;
      this.createDaemonSocket();
    }

    _Class.prototype.createDaemonSocket = function() {
      var ping;
      ping = Buffer.from([0]);
      this.daemonSocket = this.connectRemote((function(_this) {
        return function() {
          _this.daemonSocket.ref();
          _this.daemonSocket.on('data', function(data) {
            var uuid;
            if (data.length === 4) {
              uuid = data.readInt32LE(0);
              console.info("request pipe " + uuid);
              return _this.createTunnel(uuid);
            }
          });
          _this.daemonSocket.write(ping);
          return setInterval(function() {
            return _this.daemonSocket.write(ping);
          }, 10000);
        };
      })(this));
      return this.daemonSocket.on('close', (function(_this) {
        return function() {
          return setTimeout(function() {
            return _this.createDaemonSocket();
          }, 1000);
        };
      })(this));
    };

    _Class.prototype.connectRemote = function(cb) {
      var socket;
      socket = Net.connect(this.remoteAddress.port, this.remoteAddress.ip, cb);
      socket.on('error', console.error);
      return socket;
    };

    _Class.prototype.connectLocal = function(cb) {
      var socket;
      socket = Net.connect(this.localAddress.port, this.localAddress.ip, cb);
      socket.on('error', console.error);
      return socket;
    };

    _Class.prototype.createTunnel = function(uuid) {
      var ping, socket;
      ping = new Buffer(4);
      ping.writeInt32LE(uuid, 0);
      return socket = this.connectRemote((function(_this) {
        return function() {
          var local;
          console.info("connect remote " + uuid);
          return local = _this.connectLocal(function() {
            console.info("connect local " + uuid);
            socket.write(ping);
            socket.pipe(local).pipe(socket);
            return console.info("piped " + uuid);
          });
        };
      })(this));
    };

    return _Class;

  })();

}).call(this);
