# Litmus Test

Run Litmus Tests directly from the command line using Node.

A work in progress :(

## Install

```bash
$ npm install litmus-test
```

*Note: This will need to be `npm link`ed for now.*

## Configure

*TODO: Use a local package.json file.*

```bash
$ cp config.example.json config.json
```

And update the settings however you like.

## Quick start

Pipe a file at it:

```bash
$ cat path/to/email.html | litmus-test -d test/dir
```

*PENDING: Or use a Node.js stream:*

```js
var fs = require('fs')
  , LitmusTest = require('./lib/litmus-test')
;

fs.createReadStream('foo/bar.html')
  .pipe(new LitmusTest)
;
```

## Help

Thankfully, `commander` provides us with a command-line help:

```bash
$ litmus-test -h
  Usage: litmus-test [options]

  Options:

    -h, --help              output usage information
    -V, --version           output the version number
    -t, --testId <n>        test id for re-testing emails
    -i, --imageDir [value]  images file path
    -f, --htmlFile [value]  html email file to test
    -d, --dir [value]       set s3 directory to upload assets in bucket
    -l, --list              retrieve list of tests from litmus api
```

## API integration

### List tests

```bash
$ litmus-test -l
```

### Re-test

```bash
$ cat path/to/email.html | litmus-test -t TEST_ID
```

*PENDING: within Node.js, it is possible to create-or-retest:*

```js
var fs = require('fs')
  , LitmusTest = require('./lib/litmus-test')
;

fs.createReadStream('foo/bar.html')
  .pipe(new LitmusTest({ testId: TEST_ID }))
;
```
