var Grid = require('gridfs-stream');
var stream = require('stream');
var fs = require('fs');

function streamToBuffer(source, cb) {
  var chunks = [];
  var buffer = new stream.Writable();

  buffer._write = function (chunk, enc, done) {
    chunks.push(chunk);
    done();
  };

  source.on('end', function () {
    cb(null, Buffer.concat(chunks));
  });

  source.on('error', function (err) {
    cb(err);
  });

  source.pipe(buffer);
}

Grid.prototype.fromFile = function (options, source) {
  var ws = this.createWriteStream(options);
  var rs = typeof source === 'string' ? fs.createReadStream(source) : source;

  return {
    id: ws.id,
    save: function (cb) {
      ws.on('close', function (file) {
        return cb(null, file);
      });

      ws.on('error', function (err) {
        cb(err);
      });

      rs.pipe(ws);
    }
  };
};

Grid.prototype.toFile = function (options, target, cb) {
  var rs = this.createReadStream(options);
  var ws = typeof target === 'string' ? fs.createWriteStream(target) : target;

  ws.on('close', function () {
    cb(null);
  });

  rs.pipe(ws);
};

Grid.prototype.readFile = function (options, cb) {
  streamToBuffer(this.createReadStream(options), cb);
};

Grid.prototype.writeFile = function (options, data, cb) {
  data = data instanceof Buffer ? data : data.toString();
  var ws = this.createWriteStream(options);

  ws.on('error', function (err) {
    cb(err);
  });

  ws.on('close', function (file) {
    cb(null, file);
  });

  ws.end(data);
};

module.exports = exports = Grid;
