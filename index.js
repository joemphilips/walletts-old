const fs = require('fs-extra')
setTimeout(() => {
  fs.mkdirs(process.env.HOME + "/hoge")
}, 10)
