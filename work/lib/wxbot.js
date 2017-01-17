'use strict'
const Wechat = require('../../index')
const debug = require('debug')('wxbot')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')


class WxBot extends Wechat {

  constructor () {
    super()

    this.memberInfoList = []

    this.replyUsers = new Set()
    this.on('message', msg => {
      if (msg.MsgType === this.CONF.MSGTYPE_TEXT) {
        this._botReply(msg)
      }
    })

    this.superviseUsers = new Set()
    this.openTimes = 0
    this.on('message', msg => {
      if (msg.MsgType === this.CONF.MSGTYPE_STATUSNOTIFY) {
        this._botSupervise()
      }
    })

    this.on('error', err => debug(err))
  }

  get replyUsersList () {
    return this.friendList.map(member => {
      member.switch = this.replyUsers.has(member['UserName'])
      return member
    })
  }

  get superviseUsersList () {
    return this.friendList.map(member => {
      member.switch = this.superviseUsers.has(member['UserName'])
      return member
    })
  }

  _tuning (word) {
    return this.request({
      method: 'GET',
      url: 'http://api.hitokoto.us/rand'
    }).then(res => {
      return res.data.hitokoto
    }).catch(err => {
      debug(err)
      return '现在思路很乱，最好联系下我哥 T_T...'
    })
  }

  _generateQr(link, callback) {
    var filename = Date.now() + '.png'
    var parentDir = path.resolve(process.cwd(), '..')

    var targetFilePath = parentDir + '/qrcode/' + filename
    var _this = this
    QRCode.save(targetFilePath, link, function (err, written) {
      if (err) { 
        debug(err)
        callback(err, null)
        return
      }
      fs.readFile(targetFilePath, function (err, buffer) {
        if (err) throw err;
        let pic = {}
        pic.file = buffer
        pic.filename = filename
        callback(null, pic)
      })
    })
  }

  _botReply (msg) {
    if (this.replyUsers.has(msg['FromUserName'])) {
      this._tuning(msg['Content']).then(reply => {
        // this.sendText(reply, msg['FromUserName'])
        debug(reply)
      })
      this._generateQr('www.baidu.com', (err, pic) => {
        this.sendMsg(pic, msg['FromUserName'])
      })
    }
  }

  _botSupervise () {
    const message = '我的主人玩微信' + ++this.openTimes + '次啦！'
    for (let user of this.superviseUsers.values()) {
      this.sendMsg(message, user)
      debug(message)
    }
  }

}

exports = module.exports = WxBot
