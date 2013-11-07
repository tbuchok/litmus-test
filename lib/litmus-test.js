var Transform = require('stream').Transform
  , util = require('util')
  , path = require('path')
  , fs = require('fs')
  , mime = require('mime')
  , jsdom = require('jsdom')
  , config = require('../config.json')
  , knox = require('knox')
  , client = knox.createClient({
        key: config.S3_ACCESS_KEY_ID
      , secret: config.S3_SECRET_ACCESS_KEY
      , bucket: config.S3_BUCKET
    })
  , request = require('request')
  , sax = require('sax').createStream(true)
  , Email = require('email').Email
;

util.inherits(LitmusTest, Transform)
function LitmusTest(options) {
  Transform.call(this);
  options = options || {};
  this.subject = options.subject || 'LitmusTest';
  this.testId = options.testId;
  this.imageDir = options.imageDir;
  this.dir = options.dir;
  this.buffer = [];
}
LitmusTest.list = function() {
  var testSets = []
    , testSet = {}
    , key
  ;

  var setKey = function(n) {
    if (n.name !== undefined)
      key = n.name
  };
  var setValue = function(v) {
    if (testSet[key] === undefined)
      testSet[key] = v
  };

  request(config.API_URL + 'tests.xml')
    .auth(config.API_USERNAME, config.API_PASSWORD)
    .pipe(sax)
    .on('opentag', function(n) {
      if (n.name == 'test_set') {
        this.on('opentag', setKey)
        this.on('text', setValue)
      }
    })
    .on('closetag', function(name) {
      if (name == 'test_set') {
        this.removeListener('opentag', setKey);
        this.removeListener('text', setValue);
        testSets.push(testSet);
        testSet = {};
      }
    })
    .on('end', function() {
      testSets.forEach(function(t) {
        var truncated = t.name.slice(0, 10) + '...';
        console.log('name: %s\tid: %s\tcreated_at: %s\n',
                     truncated,
                     t.id,
                     new Date(t.created_at)
                    );
      })
    })
  ;
}
LitmusTest.prototype._transform = function(chunk, enc, next) {
  this.buffer.push(chunk);
  next();
};

LitmusTest.prototype._flush = function(done) {
  var self = this
    , fileLocation = path.join(self.dir, 'index.html')
  ;

  // Poll until received
  self.once('testSent', function() {
    console.log('Test sent.');
  });

  // Send email to Litmus:
  self.once('testAddress', function(address) {
    console.log('Sending to address:\t%s\t...', address);
    var options = {
        from: config.FROM_EMAIL_ADDRESS
      , to: address
      , subject: self.subject
      , bodyType: 'html'
      , body: self.processedHTML
    };
    new Email(options)
      .send(function(err) {
        if (err)
          return console.error(err);
        self.emit('testSent');
      })
    ;
  });

  self.on('s3Complete', function(url) {
    console.log('S3 complete:\t\t%s', url);
    var xml = '<?xml version="1.0"?>' +
                '<test_set>' +
                  '<save_defaults>false</save_defaults>' +
                  '<use_defaults>true</use_defaults>' +
                '</test_set>'
      , options = {
          url: (self.testId)  
               ? config.API_URL + 'tests/' + self.testId + '/versions.xml' 
               : config.API_URL + 'emails.xml'
        , method: 'POST'
        , body: xml
        , headers: { 'content-type': 'application/xml' }
      }
    ;

    console.log('Hitting Litmus API:\t%s\t...', options.url);
    request(options)
      .auth(config.API_USERNAME, config.API_PASSWORD)
      .pipe(sax)
      .on('opentag', function(n) {
        if (n.name == 'url_or_guid')
          this.once('text', function(value) { self.emit('testAddress', value) })
      })
    ;
  });

  // TODO: update image links and upload to S3!!

  self.on('imagesProcessed', function() {
    var options = { 
        'content-length': self.processedHTML.length
      , 'content-type': 'text/html'
      , 'x-amz-acl': 'public-read'
    }
    client
      .put(fileLocation, options)
      .on('response', function(res) {
        if (200 == res.statusCode)
          self.emit('s3Complete', this.url)
      })
      .end(self.processedHTML)
    ;
  });

  self.once('imagesUploaded', function() {
    var data = self.buffer.join('');
    jsdom.env(data, function(err, window) {
      var document = window.document
        , images = document.querySelectorAll('img')
      ;
      console.log(images.length);
      Object.keys(images).forEach(function(i) {
        var img = images[i];
        if (!img.src)
          return;

        img.src = path.join(  'http://'
                              , config.S3_BUCKET + '.s3.amazonaws.com'
                              , self.dir
                              , 'images'
                              , path.basename(img.src)
                            );
      });
      self.processedHTML = document.documentElement.outerHTML;
      self.emit('imagesProcessed')
    });
  });

  handleImageDir = function(err, images) {
    var count = 0;
    if (err)
      return self.emit('error', err);
    self.on('image', function() {
      count += 1;
      if (count >= images.length)
        self.emit('imagesUploaded');
    });
    images.forEach(function(img) {
      var imagePath = path.join(self.imageDir, img);
      fs.stat(imagePath, function(err, stats) {
        if (err)
          return self.emit('error', err);
        var req = client.put(path.join(self.dir, 'images', img), {
            'content-length': stats.size
          , 'content-type': mime.lookup(img)
          , 'x-amz-acl': 'public-read'
        }).on('response', function(res) {
          self.emit('image');
        });
        fs.createReadStream(imagePath)
          .pipe(req)
          .on('error', function(err) { self.emit('image') })
        ;
      });
    });
  }

  if (self.imageDir)
    return fs.readdir(self.imageDir, handleImageDir);s

  // no images, act like they were uploaded:
  self.emit('imagesUploaded');  
};

module.exports = LitmusTest;