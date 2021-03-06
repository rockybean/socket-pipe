// Generated by CoffeeScript 1.10.0
(function() {
  var Event, Net;

  Net = require('net');

  Event = require('events');

  module.exports = (function() {
    function _Class(localAddress, remoteAddress) {
      this.localAddress = localAddress;
      this.remoteAddress = remoteAddress;
      this.id = 0;
      this.dataEvent = new Event;
      this.daemonSocket = null;
      this.sockets = {};
      this.pipes = {};
      this.dataEvent.on('pipe', (function(_this) {
        return function(uuid) {
          var buff;
          if (_this.sockets[uuid] == null) {
            return;
          }
          if (_this.pipes[uuid] == null) {
            buff = new Buffer(4);
            buff.writeInt32LE(uuid);
            if (_this.daemonSocket == null) {
              return;
            }
            console.info("request pipe " + uuid);
            return _this.daemonSocket.write(buff);
          }
          _this.sockets[uuid].pipe(_this.pipes[uuid]).pipe(_this.sockets[uuid]);
          return _this.sockets[uuid].resume();
        };
      })(this));
      this.createLocalServer();
      this.createRemoteServer();
    }

    _Class.prototype.accept = function(socket) {
      var uuid;
      console.info("accept " + socket.remoteAddress + ":" + socket.remotePort);
      socket.pause();
      uuid = this.id;
      this.id += 1;
      this.sockets[uuid] = socket;
      socket.on('close', (function(_this) {
        return function() {
          console.info("close socket " + uuid);
          if (_this.sockets[uuid] != null) {
            return delete _this.sockets[uuid];
          }
        };
      })(this));
      socket.on('error', console.error);
      return this.dataEvent.emit('pipe', uuid);
    };

    _Class.prototype.createRemoteServer = function() {
      this.remoteServer = Net.createServer((function(_this) {
        return function(socket) {
          return _this.accept(socket);
        };
      })(this));
      this.remoteServer.on('error', console.error);
      return this.remoteServer.listen(this.remoteAddress.port, this.remoteAddress.ip);
    };

    _Class.prototype.createLocalServer = function() {
      this.localServer = Net.createServer((function(_this) {
        return function(socket) {
          var connected;
          connected = false;
          socket.on('error', console.error);
          return socket.on('data', function(data) {
            var uuid;
            if (!connected) {
              connected = true;
              if (data.length === 1) {
                console.info("connected " + socket.remoteAddress + ":" + socket.remotePort);
                return _this.daemonSocket = socket;
              } else if (data.length === 4) {
                uuid = data.readInt32LE(0);
                _this.pipes[uuid] = socket;
                socket.on('close', function() {
                  console.info("close pipe " + uuid);
                  if (_this.pipes[uuid] != null) {
                    return delete _this.pipes[uuid];
                  }
                });
                console.info("created pipe " + uuid);
                return _this.dataEvent.emit('pipe', uuid);
              }
            }
          });
        };
      })(this));
      this.localServer.on('error', console.error);
      return this.localServer.listen(this.localAddress.port, this.localAddress.ip);
    };

    return _Class;

  })();

}).call(this);
