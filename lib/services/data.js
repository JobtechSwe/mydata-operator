const { list } = require('./consents')
const pds = require('../adapters/pds')
const merge = require('merge')

const read = async (consentId, domain, area) => {
  const consents = await list(consentId, domain, area)
  if (consents.length === 0) {
    throw Error('Found no consents for the provided arguments')
  }
  const content = await Promise.all(
    consents.map(async ({
      pdsProvider,
      pdsCredentials,
      domain,
      area
    }) => {
      const path = `/data/${encodeURIComponent(domain)}/${encodeURIComponent(area)}.json`
      const content = await pds
        .get({ pdsProvider, pdsCredentials })
        .readFile(path, 'utf8')
        .catch(_ => null)
      const result = {
        [domain]: {
          [area]: content
        }
      }
      return result
    }))

  return content.reduce((obj, res) => merge.recursive(obj, res))
}

const write = async (consentId, domain, area, data) => {
  const consents = await list(consentId, domain, area)
  const { pdsProvider, pdsCredentials } = consents[0]
  const path = `/data/${encodeURIComponent(domain)}/${encodeURIComponent(area)}.json`
  const provider = pds.get({ pdsProvider, pdsCredentials })
  await provider.outputFile(path, JSON.stringify(data), 'utf8')
}

module.exports = {
  read,
  write
}
