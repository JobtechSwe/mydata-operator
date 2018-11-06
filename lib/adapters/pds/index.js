const { promisify } = require('util')
const providers = {
  dropbox: require('./dropbox')
}

function promiseFs(lib) {
  return Object
    .keys(lib)
    .filter(prop => typeof lib[prop] === 'function')
    .reduce((newLib, funcName) => Object.assign(newLib, { [funcName]: promisify(lib[funcName].bind(lib)) }), {})
}

function get({ pds_provider, pds_credentials }) {
  return promiseFs(providers[pds_provider](JSON.parse(pds_credentials.toString('utf8'))))
}

module.exports = get
