// buffer-equal-constant-time 1.0.1 still references the removed SlowBuffer
// export. Keep the legacy JWT stack working while the application uses Node 26.
const buffer = require('buffer');
if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = Buffer;
}
