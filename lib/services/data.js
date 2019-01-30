const { query } = require('../adapters/postgres')
const pds = require('../adapters/pds')
const { camelCase } = require('changecase-objects')
const merge = require('merge')

const get = async (consentId, domain, area) => {
  let sql = `
    SELECT
      cr.account_id,
      a.pds_provider,
      a.pds_credentials,
      s.domain,
      s.area,
      s.read,
      s.write
    FROM
      consent_requests as cr
    INNER JOIN
      accounts as a on a.id = cr.account_id
    INNER JOIN
      scope as s on s.consent_id = cr.consent_id
    WHERE cr.consent_id = $1`
  const params = [consentId]

  if (domain) {
    sql += ' AND s.domain = $2'
    params.push(domain)

    if (area) {
      sql += ' AND s.area = $3'
      params.push(area)
    }
  }

  const result = await query(sql, params)

  const content = await Promise.all(result.rows
    .map(row => {
      row.pds_credentials = JSON.parse(row.pds_credentials.toString('utf8'))
      return camelCase(row)
    })
    .map(async ({
      pdsProvider,
      pdsCredentials,
      domain,
      area
    }) => {
      debugger
      const content = await pds
        .get({ pdsProvider, pdsCredentials })
        .readFile(`/data/${domain}/${area}.json`)
      return {
        [domain]: {
          [area]: content
        }
      }
    }))
  return content.reduce((obj, res) => merge.recursive(obj, res))
}

const set = async (consentId, domain, area, data) => {

}

module.exports = {
  get,
  set
}
