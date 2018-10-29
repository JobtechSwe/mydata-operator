const storage = {
  anna123: {
    baseData: {
      firstName: 'Anna',
      lastName: 'Andersson'
    },
    careerData: {
      headline: 'UX at SuperCompany',
      experience: [
        {
          employer: 'SuperCompany',
          title: 'UX',
          fromDate: '2014',
          toDate: '2018',
          description: `At SuperCompany I'm doing user research, prototyping, wireframes etc. Working in a cross-functional team.`
        },
        {
          employer: 'MyStartup',
          title: 'Co-founder & CMO',
          fromDate: '2010',
          toDate: '2013',
          description: `Business modelling, raising capital, prototyping, marketing, project leader, B2B-sales, PR activities, public speaking, product/market development, user testing, etc.`
        }
      ],
      education: [
        { schoolName: 'Uppsala University', fieldOfStudy: 'Computer Science', degree: 'Master' },
        { schoolName: 'Hyper Island', fieldOfStudy: 'UX' }
      ],
      languages: [
        { languageName: 'Swedish', proficiency: 'Pretty good' },
        { languageName: 'English', proficiency: 'Not bad' }
      ]
    }
  }
}

function getForAccount (accountId) {
  return storage[accountId]
}

module.exports = {
  getForAccount
}
