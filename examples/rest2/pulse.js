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
      'PID', 'MTS', 'PUID', 'TITLE', 'CONTENT'
    ],
    rows: pulseHistRes.map(({ id, mts, userID, title, content }) => [
      id,
      new Date(mts).toLocaleString(),
      userID,
      (title && title.substring(0, 10)) || '-',
      content.substring(0, 10)
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
      (pulse.title && pulse.title.substring(0, 10)) || '-',
      pulse.content.substring(0, 10)
    ]]
  })
  const pulseComment = new PulseMessage({
    parent: pulse.id,
    title: '1234 5678 Foo Bar Baz Qux TITLE',
    content: '1234 5678 Foo Bar Baz Qux Content',
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
      'PID', 'MTS', 'PARENT', 'PUID', 'TITLE', 'CONTENT'
    ],
    rows: [[
      comment.id,
      new Date(comment.mts).toLocaleString(),
      comment.parent,
      comment.userID,
      (comment.title && comment.title.substring(0, 10)) || '-',
      comment.content.substring(0, 10)
    ]]
  })
})
