var LitmusTest = require('./lib/litmus-test')
  , program = require('commander')
;

program
  .version('0.0.1')
  .option('-t, --testId <n>', 'Test ID for re-testing emails')
  .parse(process.argv)
;

process.stdin
  .pipe(new LitmusTest(program))
  .pipe(process.stdout)
;