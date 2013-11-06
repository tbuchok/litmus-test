# Litmus Test

Run Litmus Tests directly from the command line using Node.

## Install

`$ npm install litmus-test`

## Quick start

Pipe a file at it:

```bash
$ cat path/to/email.html | litmus-test
```

Or use a Node.js stream:

```js
var fs = require('fs')
  , LitmusTest = require('./lib/litmus-test')
;

fs.createReadStream('foo/bar.html')
  .pipe(new LitmusTest)
;
```

# NOT IMPLEMENTED
## API integration

### List tests

LitmusTest uses a LevelDB store to keep track of tests.

```bash
$ litmus-test ls
```

This listing can be updated:

```bash
$ litmus-test update
```

### Re-test

```bash
$ cat path/to/email.html | litmus-test TEST_ID
```

Within Node.js, it is possible to create-or-retest:

```js
var fs = require('fs')
  , LitmusTest = require('./lib/litmus-test')
;

fs.createReadStream('foo/bar.html')
  .pipe(new LitmusTest({ id: TEST_ID }))
;
```
