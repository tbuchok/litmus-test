#! /usr/local/bin/node

var path = require('path')
  , fs = require('fs')
  , LitmusTest = require('./lib/litmus-test')
  , program = require('commander')
  , readable = process.stdin
;

program
  .version('0.0.1')
  .option('-t, --testId <n>', 'test id for re-testing emails')
  .option('-i, --imageDir [value]', 'images file path')
  .option('-f, --htmlFile [value]', 'html email file to test')
  .option('-d, --dir [value]', 'set s3 directory to upload assets in bucket')
  .option('-l, --list', 'retrieve list of tests from litmus api')
  .parse(process.argv)
;

if (program.list)
  return LitmusTest.list();

if (program.dir === undefined)
  return console.error('ERR: directory [-d] is required in order to upload assets.');

if (program.imageDir) {
  var imagesDir = path.join(process.cwd(), program.imageDir);
  if (!fs.existsSync(imagesDir))
    return console.error('ERR: Image file path does not exist. Update and try again.')
}

if (program.htmlFile) {
  var htmlFile = path.join(process.cwd(), program.htmlFile);
  if (!fs.existsSync(htmlFile))
    return console.error('ERR: HTML file path does not exist. Update and try again.')
  readable = fs.createReadStream(htmlFile);
}

readable
  .pipe(new LitmusTest(program))
  .pipe(process.stdout)
;

