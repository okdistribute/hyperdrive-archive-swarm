var webRTCSwarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var events = require('events')
var discoverySwarm = require('discovery-swarm')
var swarmDefaults = require('datland-swarm-defaults')

var DEFAULT_SIGNALHUB = 'https://signalhub.mafintosh.com'

module.exports = function (archive, opts) {
  var emitter = new events.EventEmitter()
  if (!opts) opts = {}
  var swarmKey = (opts.SWARM_KEY || 'hyperdrive-') + archive.key.toString('hex')

  if (process.browser) {
    var ws = webRTCSwarm(signalhub(swarmKey, opts.SIGNALHUB_URL || DEFAULT_SIGNALHUB))
    ws.on('peer', peer => {
      emitter.emit('peer', peer)
      peer.pipe(archive.replicate()).pipe(peer)
    })
  }

  if (process.versions.node) {
    var ds = discoverySwarm(swarmDefaults({
      stream: peer => {
        emitter.emit('peer', peer)
        return archive.replicate()
      }
    }, opts))
    ds.once('listening', () => ds.join(swarmKey))
    ds.listen(0)
    emitter.close = ds.close.bind(ds)
  }
  return emitter
}
