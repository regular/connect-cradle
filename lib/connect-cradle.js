/*!
 * Connect - Cradle
 * Copyleft 2011 ElDios aka 'Lele' <lele@amicofigo.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var cradle = require('cradle');

/**
 * Return the `CradleStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */

module.exports = function(connect){

   var oneDay = 86400;

  /**
   * Connect's Store.
   */

  var Store = connect.session.Store;

  /**
   * Initialize CradleStore with the given `options` or defaults if a specific option is not provided
   *
   * @param {Object} options
   * @api public
   */

  function CradleStore(options) {
    options = options || {};
    options.dbName = options.dbName || 'sessions';
    options.hostname = options.hostname || '127.0.0.1';
    options.port = ( typeof options.port == 'number' && options.port >= 1 && options.port < 65535 ) ? options.port : '5984' ;
    options.cache = typeof options.cache == 'boolean' ? options.cache : true;
    options.raw = typeof options.raw == 'boolean' ? options.raw : false;
    options.secure = typeof options.secure == 'boolean' ? options.secure : false;
    if (options.secure) {
        options.auth = ( typeof options.auth.username == 'string' && typeof options.auth.password == 'string' ) ? options.auth : '' ;        
    }

    console.log("creating session store with options", JSON.stringify(options));
    Store.call(this, options);
    this.client = new (cradle.Connection)(options.hostname,options.port,{
      auth: options.auth ,
      cache: options.cache ,
      raw: options.raw ,
      secure : options.secure
    }).database(options.dbName);
  };

  /**
   * Inherit from `Store`.
   */

  CradleStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  CradleStore.prototype.get = function(sid, fn){
    console.log("getting session", sid);
    this.client.get(sid, function(err, doc) {
        if (err) {
            fn(JSON.stringify(err));
        } else {
            fn(null, doc);            
        }
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  CradleStore.prototype.set = function(sid, sess, fn){
      console.log("setting session", sid);
      this.client.save(sid, sess, fn);
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */

  CradleStore.prototype.destroy = function(sid, fn){
    var self = this;
    console.log("removing session", sid);
    
    function tryToRemove(sid, fn) {
        self.client.get(sid, function(err, doc) {
            if (doc) {
                console.log("at rev", doc._rev);
                self.client.remove(sid, doc._rev, function(err, res) {
                    if (err) {
                        //tryToRemove(sid, fn);
                        console.log(JSON.stringify(err));
                        fn && fn(err);
                    } else {
                        fn && fn();
                    }
                });            
            } else {
                fn && fn();
            }
        });
    }
    tryToRemove(sid, fn);
  };

  return CradleStore;
};