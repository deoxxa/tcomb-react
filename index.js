'use strict';

var t = require('tcomb-validation');
var format = t.format;
var noop = function () {};

function propTypes(type) {
  var ret = {};
  var isSubtype = (type.meta.kind === 'subtype');
  var props = isSubtype ? type.meta.type.meta.props : type.meta.props;

  Object.keys(props).forEach(function (k) {
    var name = t.getTypeName(props[k]);

    var checkPropType = function() {};

    if (process.env.NODE_ENV !== 'production') {
      // React custom prop validators
      // see http://facebook.github.io/react/docs/reusable-components.html
      checkPropType = function checkPropType(values, prop, displayName) {
        var value = values[prop];
        if (!t.validate(value, props[prop]).isValid()) {
          var message = format('Invalid prop `%s` = `%s` supplied to `%s`, should be `%s`', prop, value, displayName, name);
          // add a readable entry in the call stack
          checkPropType.displayName = message;
          t.fail(message);
        }
      };
    }

    // attach the original tcomb definition, so other components can read it
    // via `propTypes.whatever.tcomb`
    checkPropType.tcomb = props[k];

    ret[k] = checkPropType;
  });

  if (process.env.NODE_ENV !== 'production') {
    // kinda hacky
    if (isSubtype) {
      ret.__all__ = function (values, prop, displayName) {
        if (!type.meta.predicate(values)) {
          var message = format('Invalid props `%j` supplied to `%s`, should be `%s`', values, displayName, t.getTypeName(type));
          t.fail(message);
        }
      };
    }
  }

  return ret;
}

// ES7 decorator
// in production will be a noop
function props(Type) {
  if (process.env.NODE_ENV !== 'production') {
    Type = t.Type.is(Type) ? Type : t.struct(Type);
    return function (Component) {
      Component.propTypes = propTypes(Type);
    };
  } else {
    return noop;
  }
}

module.exports = {
  propTypes: propTypes,
  props: props
};