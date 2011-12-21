var app = require('express').createServer()
  , urlparse = require('urlparse.js').parse
  , endpoint = require('../index')
  , express = require('express')
//  , endpoint = require('connect-endpoint')

var test_opts =
  { path: '/my/endpoint'
  , doc_on_error: true
  , description: 'My endpoint.'
  , example: '/my/endpoint?firstname=bob&lastname=corsaro&age=34'
  , parameters:
    [ { name: 'firstname'
      , rules: ['regex(^[^0-9_]+$)', 'required', 'once']
      , description: 'The first name.'
      }
    , { name: 'lastname'
      , rules: ['regex(^[^0-9_]+$)', 'required', 'once']
      , description: 'The last name.'
      }
    , { name: 'homepage'
      , rules: ['url', 'max(3)']
      , description: 'The home page.'
      }
    , { name: 'age'
      , rules: ['number', 'required', 'gte18', 'once']
      , description: 'The age. Must be at least 18.'
      }
    , { name: 'favorite-color'
      , rules: ['default(blue)', 'regex(^(blue|red|yellow|black|white|green)$)', 'once']
      , descripton: 'Your favorite color'
      }
    , { name: 'crazy'
      , rules: ['default(false)', 'boolean']
      , description: 'Are you crazy?'
      }
    , { name: 'callback'
      , rules: ['callback']
      , description: 'JSONP Callback'
      }
    ]
  , rules:
    { gte18: function(name) {
        return function(vals) {
          return vals.map(function(val) {
            if (val < 18) {
              throw new Error("["+val+"] is less then 18")
            } else {
              return val
            }
          })
        }
      }
    }
  , handler: function(req, res) {
      res.send('<pre>'+JSON.stringify(req.endpoint_params, null, 2)+"</pre>")
    }
  , app: app
  }

var echo_opts =
  { path: '/echo'
  , description: 'Echo message'
  , example: '/echo?msg=Hello+World'
  , parameters:
    [ { name: 'msg'
      , rules: ['required', 'max(1)']
      , description: 'Message that should be echoed'
      }
    ]
  , handler: function(req, res) {
      res.send('<pre>'+req.endpoint_params.msg[0]+'<\pre>')
    }
  , app: app
  }

app.use('/static', express.static(__dirname + '/../public'))
app.use(express.logger())
app.use(express.errorHandler())
endpoint(test_opts)
endpoint(echo_opts)
endpoint.catalog({app: app, path: '/'})

app.listen(3000)
