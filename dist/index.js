
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./directus-authprovider.cjs.production.min.js')
} else {
  module.exports = require('./directus-authprovider.cjs.development.js')
}
