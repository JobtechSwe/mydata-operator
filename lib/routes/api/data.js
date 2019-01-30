const { Router } = require('express')
// const createError = require('http-errors')
// const consentService = require('./../../services/consents')
// const accountService = require('./../../services/accounts')
// const pds = require('./../../adapters/pds')
// const { basename } = require('path')

const router = Router()

router.get('/:domain', async (req, res, next) => {
  /* try {
    const { accountId } = await consentService.get(req.query.consentId)

    const account = await accountService.get(accountId)

    console.warn('account', account)

    // const fs = pds.get(account)
    // let areas
    // if (req.params.area) {
    //   areas = [`${req.params.area}.json`]
    // } else {
    //   areas = await fs.readdir('/data')
    // }

    // if (areas.length === 0) {
    //   return res.status(200).send({
    //     data: {},
    //     links: { self: req.originalUrl }
    //   })
    // }

    // const data = await Promise.all(areas.map(async area => ({ [basename(area, '.json')]: JSON.parse(await fs.readFile(`/data/${area}`, { encoding: 'utf8' })) })))
  } catch (error) {
    console.warn('could not get consent or account from db', error)
    return next(createError(500))
  } */

  const data = {
    baseData: {
      firstName: 'Adam',
      lastName: 'Naeslund',
      headline: 'Looking for opportunities'
    },
    education: [
      {
        schoolName: 'Uppsala University',
        fieldOfStudy: 'Computer Science'
      }
    ],
    languages: [
      {
        languageName: 'Swedish',
        proficiency: 'Native'
      },
      {
        languageName: 'English',
        proficiency: 'Fluent'
      },
      {
        languageName: 'Javascript',
        proficiency: 'Fluent'
      }
    ],
    experience: [
      {
        employer: 'Iteam',
        title: 'Developer',
        fromDate: '2017',
        toDate: '2019',
        description: 'Developing software and other various things'
      },
      {
        employer: 'Posten AB',
        title: 'Mail Delivery Technican Assistent Manager',
        fromDate: '2012',
        toDate: '2017',
        description: 'Did things'
      }
    ]
  }

  res.send(data)
})

module.exports = router
