/**
 * Parameter parsing middleware for endpoint.
 */
var Hash = require('hashish')
  , defaultRules = require('../rules')
  , step = require('step')
  , utils = require('../utils');

/**
 * Parses arguments according to rules.
 *
 *  - `parameters` Defined parameters by rules
 *  - `rules`      Custom rules
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
exports = module.exports = function(options) {
  var config = Hash({rules: {}}).update(options || {}).end
    , rules = {}
    , r;

  for (r in defaultRules) {
    rules[r] = defaultRules[r];
  }

  config.rules = Hash(rules).update(config.rules).end;

  function parseRule(ruleStr) {
    var regex = /^([^(]+)(\((.*)\))?$/
      , ruleGroup = regex.exec(ruleStr).slice(1);

    return ({
      name: ruleGroup.shift(),
      arg: ruleGroup[1] });
  }

  // verify that rules exist
 config.parameters.forEach(function(paramDef) {
    paramDef.rules.forEach(function(ruleStr) {
      var rule = parseRule(ruleStr);

      if (!config.rules[rule.name]) {
        throw "Rule [" + rule.name + "] does not exist";
      }
    })
  })

  function normalizedParam(req, name, def) {
    var val = req.param(name, def);

    if ('undefined' == typeof(val)) {
      val = [];
    } else if (val.constructor.toString().indexOf('Array') == -1) {
      val = [val];
    }

    return val;
  }


  function parseParams(req, parseCb) {
    var params
      , rule
      , ruleFn
      , normalParam;

    params = utils.resolveParameters(config.parameters,
      req.endpointExtraParams)

    step(
      function parseParams() {
        var self = this;

        params.forEach(function(paramDef) {
          function applyRules(oldValue, rules, cb) {
            if (rules.length > 0) {
              rule = parseRule(rules[0]);

              try {
                ruleFn = config.rules[rule.name](paramDef.name, rule.arg);
                ruleFn(oldValue, function(err, newValue) {
                  if (err) throw err;
                  applyRules(newValue, rules.slice(1), cb);
                })
              } catch(e) {
                e.parameterName = paramDef.name;
                cb(null, [e, paramDef.name, oldValue]);
              }
            } else {
              cb(null, [null, paramDef.name, oldValue]);
            }
          }
          normalParam = normalizedParam(req, paramDef.name);
          applyRules(normalParam, paramDef.rules, self.parallel());
        })
      },
      parseCb
    )
  }

  return function(req, res, next) {
    try {
      config.parameters = utils.resolveParameters(config.parameters, req.endpointExtraParameters);
      req.endpoint_config = config;

      parseParams(req, function(err) {
        var errors = []
          , error;

        if (err) {
          next(err);
        } else {
          req.endpointParams = {};
          ;[].slice.call(arguments, 1).forEach(function(param) {
            if (param[0]) {
              errors.push(param[0]);
             } else {
              req.endpointParams[param[1]] = param[2];
            }
          })
          if (errors.length > 0) {
            error = new Error('Error parsing parameters');
            error.paramErrors = errors;
            next(error);
          } else {
            next();
          }
        }
      })
    } catch(e) {
      next(e);
    }
  }
}