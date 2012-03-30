# express-endpoint

A tool to create and document RESTful api endpoints in a declaritive way.

## This Branch

This branch is using tip connect/express. I use npm link for development.

    $ cd ~/src/connect
    $ nmp link
    $ cd ~/src/express
    $ npm link
    $ npm link connect
    $ cd ~/src/express-endpoint
    $ npm install
    $ npm link express

Use develop.sh to test while writing code.

## Install

    npm install express-endpoint

or

    git clone http://github.com/dokipen/express-endpoint.git
    cd express-endpoint
    npm link

## Demo

http://express-endpoint.herokuapp.com/

## Human contact

rcorsaro@gmail.com

## Features

  * Flexible, pluggable parameter validation and munging.
  * HTML documentation of endpoints.
  * Respond with appropriate results using content negotiation.

### TODO

  * Automatically add rule doc to parameter doc
  * Ack request methods
  * Authentication

## Endpoint

Endpoints can be defined using the module function. It takes a single options
parameter that is an object containing the following options.

  * path         - The endpoint path as used by the express router. See
                   http://expressjs.com/guide.html#routing for details.
                   (required)
  * aliases      - An array of path aliases for the endpoint.
  * description  - A human readable description of the endpoint. (required)
  * example      - An example URL for the endpoint.
  * parameters   - The set of parameters the endpoint accepts. See below
                   for details.
  * rules        - A set of custom rules to suppliment or override the
                   default rules. Default rules are defined below.
  * handler      - The function(req, res, next) that actually handles the
                   request. See
                   http://expressjs.com/guide.html#creating-a server
                   (required)
                   The validated/sanitized parameters are passed as
                   req.endpont_params
  * doc_on_error - If specified, we will display the endpoint documentation
                   and en error message on a validation error.
  * view         - The name of the doc template.
  * render_view  - The name of the render template for text/html requests.
  * stylesheets  - Stylesheet URIs to inject into the views.

### mount(app)

Once the endpoint is created, it can be mounted on the express app by calling
`endpoint.mount(app)`. `mount(app)` is a convenience method. You can also set
things up manually like so:

    app.get(endpoint.config.path, endpoint.middleware(), endpoint.config.handler);

### middleware(selected)

endpoint.middleware(selected) returns an `Array` of middleware for the
endpoint object. By default this included the `render` and `params` middleware.

The render middleware adds a `renderEndpointData(payload)` function to the
response object. The function will render an `Object` in the appropriate
format according to the `Accept` header.

The params middleware is the meat of endpoint. It is where the parameters and
rules used to parse the request. It adds a `endpointParams` field to the
requests object that contains the parsed parameters.

## Catalog

Catalog is used to render the documentation for all endpoints. It is called
via the module property function catalog(opts). It takes a single options
parameter that is an object containing the following properties.

  * endpoints    - Endpoint objects to catalog.
  * view         - The name of the doc template.
  * stylesheets  - Stylesheet URIs to inject into the views.

## ParameterS

Parameters are defined as an object with the following parameters.

  * name         - The name of the parameter.
  * rules        - An array of rules for the parameter.
  * description  - A detailed description of the parameter.

Rules are specified as strings, with a single optional parameter. The rule
name must match an existing default rule or a custom rule that you defined.
If the rule takes a parameter, it should be appended to the end of the rule
between parenthesis. To define a default rule, the rules would be as follows:

    ['default(mydefaultvalue)']

For rules that don't take parameters, the parenthesis can be omitted.

    ['once']

Rules are executed in the order specified. Default rules are described below.

## Rule Definitions

express-endpoint validates and sanitizes parameters via rules.

express-endpoint comes with a set of rules, and custom rules are easily added.
To add rules, set the 'rules' endpoint options. The default rules can still be
used as long as you don't use the same rule name with your rules. Using the
same name as a default rule will override that rule with your implementation.
All rules expect an Array of values as input, but can return a single value.
Make sure that any rules that return a single value are specified last.

 * default(v) - Sets the parameter to _v_ if it's not specified. This should
                usually be called first.
 * required   - Ensures the parameter is specified at least once.
 * max(n)     - Ensures the parameter is not specified more then _n_ times.
 * once       - Ensures the parameter is not specified more then one time.
                It also changes the parameter from an Array to a single value.
 * url        - Ensures all specified values are valid URLs, and parses them
                using urlparse.js (http://github.com/dokipen/urlparse.js).
 * number     - Converts all specified values to numbers, ensuring they are
                valid numbers
 * regex(r)   - Ensures all specified values match the given regex _r_.
 * boolean    - Converts ('1', '', or 'true' is true). This also converts the
                parameter from an Array to a single boolean object.
 * callback   - Ensures that the given value is a valid javascript function
                name safe for use with JSONP, and that only one value is
                given. Converts the value from an array to a single value.
 * timestamp  - Ensures that the give value is a valid epoch timestamp in
                miliseconds or seconds, and converts to a javascript Date.
                Due to accepting ms or s, dates before 1971 are not accepted
                in seconds. If you are using non-current dates you should
                probably roll your own.

A rule is defined as a function(parameter_name, string_argument) that returns
a validator/sanitizer function(array_of_parameter_values). It should throw an
Error for invalid values, or return a sanitized array of values for valid
values.

Here is an example of defining a custom rule to make sure a value is greater
than or equal to 18. It assumes that the parameter has already been processed
by the 'number' rule.

    { path: '/my/endpoint'
    .. [snip] ..
    , rules:
      { gte18: function(name, arg) {
          return function(vals) {
            return vals.map(function(val) {
              if (val < 18) {
                throw new Error('['+val+'] is less then 18')
              }
            })
          }
        }
      }
    }

You can also look at lib/rules.js for more examples.

## Customizing Catalog/Documentation

To customize the CSS, mount your CSS somewhere in the app, then pass the URIs
to your custom CSS to the endpoint and catalog objects via the `stylesheets`
option. ex.

    var express = require('express')
      , app = express()
      , express_endpoint = require('express-endpoint')
      , Endpoint = express_endpoint.Endpoint
      , catalog = express_endpoint.catalog;

    app.use(static('public'));
    app.use(express_endpoint.middleware.errorHandler());

    var endpoint = new Endpoint({
      stylesheets: ['public/my/styles.css'],
      [snip]
    });
    endpoint.mount(app);

    catalog = catalog({
      stylesheets: ['public/my/styles.css'],
      endpoints: [endpoint]
    });
    app.get('/docs', catalog);

    app.listen(3000);

You can override the views similarly with the `view` and `render_view`
options.

    new Endpoint({
      view: __dirname + '/myviews/doc.jade',
      render_view: __dirname + '/myviews/render.jade'
    })
    catalog({
      view: __dirname + '/myviews/doc.jade',
    })
