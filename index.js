var LitmusTest = require('./lib/litmus-test')
;

process.stdin
  .pipe(new LitmusTest)
  .pipe(process.stdout)
;