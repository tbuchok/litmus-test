var path = require('path')
  , fs = require('fs')
  , LitmusTest = require('./lib/litmus-test')
  , program = require('commander')
  , readable = process.stdin
;

program
  .version('0.0.1')
  .option('-t, --testId <n>', 'test id for re-testing emails')
  .option('-i, --imagePath [value]', 'images file path')
  .option('-f, --htmlFile [value]', 'html email file to test')
  .parse(process.argv)
;


if (program.imagePath) {
  var imagesDir = path.join(process.cwd(), program.imagePath);
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

