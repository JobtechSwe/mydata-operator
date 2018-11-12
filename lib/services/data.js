const storage = {
  anna123: {
    baseData: {
      firstName: 'Anna',
      lastName: 'Andersson',
      headline: 'UX at SuperCompany'
    },
    experience: [
      {
        id: '1',
        employer: 'SuperCompany',
        title: 'UX',
        fromDate: '2014',
        toDate: '2018',
        description: `At SuperCompany I'm doing user research, prototyping, wireframes etc. Working in a cross-functional team.`
      },
      {
        id: '2',
        employer: 'MyStartup',
        title: 'Co-founder & CMO',
        fromDate: '2010',
        toDate: '2013',
        description: `Business modelling, raising capital, prototyping, marketing, project leader, B2B-sales, PR activities, public speaking, product/market development, user testing, etc.`
      }
    ],
    education: [
      { id: '1', schoolName: 'Uppsala University', fieldOfStudy: 'Computer Science', degree: 'Master' },
      { id: '2', schoolName: 'Hyper Island', fieldOfStudy: 'UX' }
    ],
    languages: [
      { id: '1', languageName: 'Swedish', proficiency: 'Pretty good' },
      { id: '2', languageName: 'English', proficiency: 'Not bad' }
    ]
  }
}

function getForAccount (accountId) {
  return storage['anna123']
}

function updateAreaForAccount (accountId, area, data) {
  storage['anna123'][area] = data
}

module.exports = {
  getForAccount,
  updateAreaForAccount
}
