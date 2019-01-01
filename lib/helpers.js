const humanizeDuration = require('humanize-duration');

// Helper to format run time
const shortHumanizeTime = humanizeDuration.humanizer({
    spacer: '',
    delimiter: ' ',
    language: 'shortEn',
    languages: {shortEn: {y: 'yr', mo: 'mo', w: 'w', d: 'd', h: 'h', m: 'm', s: 's', ms: 'ms'}}
  });

module.exports = {shortHumanizeTime};