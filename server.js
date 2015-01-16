var fs   = require('fs')
var net  = require('net')
var Etcd = require('node-etcd')
var argv = require('minimist')(process.argv.slice(2))

var ETCD_PREFIX = argv.prefix || argv.r || '/services'
var ETCD_HOST   = argv.host   || argv.h || '127.0.0.1'
var ETCD_PORT   = argv.port   || argv.p || 4001
var MOUNT_PATH  = argv.mount  || argv.m || process.cwd()

console.log('Etcd: http://%s:%d%s', ETCD_HOST, ETCD_PORT, ETCD_PREFIX)
console.log('Mount:', MOUNT_PATH)

var etcd = new Etcd(ETCD_HOST, ETCD_PORT)
var watch = etcd.watcher(ETCD_PREFIX, null, {recursive: true})
var services = {}

watch.on('change', function(item){
// item = { action: 'create',
//   node:
//   { key: '/services/asf',
//     dir: true,
//     value: '{}',
//     modifiedIndex: 13,
//     createdIndex: 13 } }
  if (item.action === 'set') {
    var val
    try {
      val = JSON.parse(item.node.value)
    } catch (e) {
      return console.error(e)
    }

    var host = val.host || 'localhost'
    var port = val.port || 8080
    var key  = item.node.key.split('/').pop()
    var path = MOUNT_PATH + '/' + key + '.sock'

    console.log('%s -> %s:%s', key, host, port)

    try {
      fs.unlinkSync(path)
    }
    catch(e){
      
    }

    var s = net.createServer(function(c){
      c.write('hello')
      c.end()
    })

    s.listen(path)
  }
})
watch.on('error', console.error)
