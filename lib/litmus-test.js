var Transform = require('stream').Transform
  , util = require('util')
  , request = require('request')
  , creds = require('../creds.json')
  , sax = require('sax').createStream(true)
;

util.inherits(LitmusTest, Transform)
function LitmusTest(options) {
  Transform.call(this);
  options = options || {};
  this.subject = options.subject || 'Default LitmusTest';
  this.buffer = [];
}
LitmusTest.prototype._transform = function(chunk, enc, next) {
  this.buffer.push(chunk);
  next();
};
LitmusTest.prototype._flush = function(done) {

  var xml = '<?xml version="1.0"?>' +
              '<test_set>' +
                '<save_defaults>false</save_defaults>' +
                '<use_defaults>true</use_defaults>' +
                '<email_source>' +
                   '<body><![CDATA[' +
                      this.buffer.join('') +
                   ']]></body>' +
                   '<subject>' +
                      this.subject +
                   '</subject>' +
                '</email_source>' +
              '</test_set>';

  var options = {
        url: creds.API_URL + 'emails.xml'
      , body: xml
      , headers: { 'content-type': 'application/xml' }
    }
  ;

  
  request
    .post(options)
    .auth(creds.API_USERNAME, creds.API_PASSWORD)
    .pipe(sax)
    .on('opentag', function(n) { 
      if (n.name == 'url_or_guid')
        this.once('text', console.log);
    })
    .on('end', done)
  ;

};

module.exports = LitmusTest;