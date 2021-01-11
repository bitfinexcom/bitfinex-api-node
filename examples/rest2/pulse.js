'use strict'

const { PulseMessage } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-pulse',
  rest: { env: true, transform: true }
}, async ({ debug, debugTable, rest }) => {
  debug('gettting pulse history..')
  const pulseHistRes = await rest.pulseHistory()

  debug('pulse history response')
  debugTable({
    headers: [
      'PID', 'MTS', 'PUID', 'TITLE', 'CONTENT', 'COMMENTS'
    ],
    rows: pulseHistRes.map(({ id, mts, userID, title, content, comments }) => [
      id,
      new Date(mts).toLocaleString(),
      userID,
      (title && title.substring(0, 15)) || '-',
      content.substring(0, 15),
      comments // number of comments
    ])
  })
  const pulseMsg = new PulseMessage({
    title: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    content: 'Contrary to popular belief, Lorem Ipsum is not simply random text.',
    isPublic: 0,
    isPin: 1
  })

  debug('submitting pulse message: %s', pulseMsg.toString())

  let pulse
  try {
    pulse = await rest.addPulse(pulseMsg)
  } catch (e) {
    return debug('pulse message submittion failed: %s', e.message)
  }

  debug('pulse message submission response')
  debugTable({
    headers: [
      'PID', 'MTS', 'PUID', 'TITLE', 'CONTENT'
    ],
    rows: [[
      pulse.id,
      new Date(pulse.mts).toLocaleString(),
      pulse.userID,
      (pulse.title && pulse.title.substring(0, 15)) || '-',
      pulse.content.substring(0, 15)
    ]]
  })

  const pulseComment = new PulseMessage({
    parent: pulse.id,
    content: 'No more seven warlords of the sea',
    isPublic: 0,
    isPin: 1
  })

  debug('submitting pulse comment: %s', pulseComment.toString())
  let comment
  try {
    comment = await rest.addPulseComment(pulseComment)
  } catch (e) {
    return debug('pulse comment submittion failed: %s', e.message)
  }

  debug('pulse comment submission response')
  debugTable({
    headers: [
      'PID', 'MTS', 'PARENT', 'PUID', 'COMMENT'
    ],
    rows: [[
      comment.id,
      new Date(comment.mts).toLocaleString(),
      comment.parent,
      comment.userID,
      comment.content.substring(0, 15)
    ]]
  })

  debug('gettting pulse comments..')
  const pulseComments = await rest.fetchPulseComments({
    parent: pulse.id,
    isPublic: 0, // 0 for comments made by you; 1 for all comments of the pulse
    limit: 3, // fetch given number of comments for this pulse
    end: 0 // fetch comments from a given starttime in milliseconds
  })

  debug('pulse comments response: %O', pulseComments)
  debugTable({
    headers: [
      'PID', 'MTS', 'PUID', 'COMMENT'
    ],
    rows: pulseComments.map(({ id, mts, userID, content }) => [
      id,
      new Date(mts).toLocaleString(),
      userID,
      content.substring(0, 15)
    ])
  })
})
