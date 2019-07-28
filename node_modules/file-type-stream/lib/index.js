'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fileType = require('file-type');

var _fileType2 = _interopRequireDefault(_fileType);

var _stream = require('stream');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fileTypeChunkSize = 262;

class FileTypeStream extends _stream.Transform {
  constructor(callback) {
    super({
      highWaterMark: 10
    });

    this.filetypeState = {
      callback,
      bufferedChunks: [],
      bufferedSize: 0
    };
  }

  // See https://github.com/nodejs/node/issues/8855
  _transform(chunk, encoding, cb) {
    if (!this.filetypeState) return cb(null, chunk);
    const state = this.filetypeState;
    state.bufferedChunks.push(chunk);
    state.bufferedSize += chunk.length;

    if (state.bufferedSize >= fileTypeChunkSize) {
      const buf = Buffer.concat(state.bufferedChunks);
      this.filetypeState = null;
      state.callback((0, _fileType2.default)(buf));
    }
    cb(null, chunk);
  }
}

exports.default = fn => new FileTypeStream(fn);