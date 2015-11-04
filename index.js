var LOGGING = true
var log = LOGGING ? console.log.bind(console) : function(){}

// https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function _base64ToArrayBuffer (base64) {
  var binary_string =  window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array( len );
  for (var i = 0; i < len; i++)        {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
function toArrayBuffer (buf) {
  if (typeof buf === 'string')
    return _base64ToArrayBuffer(buf)
  if (!(buf instanceof ArrayBuffer))
    throw "Must provide a valid ArrayBuffer or base64-encoded string"
  return buf
}
function top4 (byte) {
  return (byte & 0b11110000) >> 4
}
function bot4 (byte) {
  return byte & 0b00001111
}


module.exports.blockwork = function (canvas, buf) {
  buf = toArrayBuffer(buf)
  
  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf)

  function renderPass (blockSize, alpha) {
    var i = 0
    function getByte () {
      if (i >= bytes.length) 
        i = 0
      return  bytes[i++]
    }

    var baseR = getByte()
    var baseG = getByte()
    var baseB = getByte()

    for (var y = 0; y < height; y += blockSize) {
      for (var x = 0; x < height; x += blockSize) {
        var r = ((baseR + baseR + getByte()) / 3)|0
        var g = ((baseG + baseG + getByte()) / 3)|0
        var b = ((baseB + baseB + getByte()) / 3)|0
        context.fillStyle = 'rgba('+r+','+g+','+b+','+alpha+')'
        context.fillRect(x, y, blockSize, blockSize)
      }
    }
  }

  renderPass(64, 1)
}

module.exports.blockwild = function (canvas, buf, blockSize) {
  buf = toArrayBuffer(buf)
  blockSize = blockSize || 32
  
  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf)

  var baseR = bytes[0]
  var baseG = bytes[1]
  var baseB = bytes[2]
  for (var i=3; i < bytes.length; i++) {
    var byte = bytes[i]
    var r = ((baseR + byte) / 2)|0
    var g = ((baseG + byte) / 2)|0
    var b = ((baseB + byte) / 2)|0
    context.fillStyle = 'rgb('+r+','+g+','+b+')'
    var x = (top4(byte)/16*(width - blockSize))|0
    var y = (bot4(byte)/16*(height - blockSize))|0
    context.fillRect(x, y, blockSize, blockSize)
  }
}

module.exports.wildegraph = function (canvas, buf, blockSize) {
  buf = toArrayBuffer(buf)
  blockSize = blockSize || 8
  
  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf)

  var baseR = bytes[0]
  var baseG = bytes[1]
  var baseB = bytes[2]
  var lastWeight, lastX, lastY

  // pass 1: lines
  for (var i=3; i < bytes.length; i++) {
    var byte = bytes[i]
    var r = ((baseR + byte) / 2)|0
    var g = ((baseG + byte) / 2)|0
    var b = ((baseB + byte) / 2)|0
    var weight = (255-byte) / 64
    var size = blockSize * weight
    var sizeHalf = (size/2)|0
    var x = (top4(byte)/16*(width - size))|0
    var y = (bot4(byte)/16*(height - size))|0
    if (lastX !== undefined && lastY !== undefined) {
      context.strokeStyle = 'rgb('+r+','+g+','+b+')'
      context.lineWidth = Math.min(weight, lastWeight)
      context.beginPath()
      context.moveTo(lastX+sizeHalf, lastY+sizeHalf)
      context.lineTo(x+sizeHalf, y+sizeHalf)
      context.stroke()
    }
    lastX = x
    lastY = y
    lastWeight = weight
  }

  // pass 2: squares
  for (var i=3; i < bytes.length; i++) {
    var byte = bytes[i]
    var r = ((baseR + byte) / 2)|0
    var g = ((baseG + byte) / 2)|0
    var b = ((baseB + byte) / 2)|0
    var weight = (255-byte) / 64
    var size = blockSize * weight
    var x = (top4(byte)/16*(width - size))|0
    var y = (bot4(byte)/16*(height - size))|0
    context.fillStyle = 'rgb('+r+','+g+','+b+')'
    context.fillRect(x, y, size, size)
  }
}

module.exports.zigzag = function (canvas, buf) {
  buf = toArrayBuffer(buf)
  
  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf)

  var baseR = bytes[0]
  var baseG = bytes[1]
  var baseB = bytes[2]
  var lastX, lastY

  for (var i=3; i < bytes.length; i++) {
    var byte = bytes[i]
    var r = ((baseR + byte) / 2)|0
    var g = ((baseG + byte) / 2)|0
    var b = ((baseB + byte) / 2)|0
    var x = (top4(byte)/16*(width))|0
    var y = (bot4(byte)/16*(height))|0
    var weight = byte/64

    if (i % 2 === 0)
      y = lastY
    else
      x = lastX

    context.strokeStyle = 'rgb('+r+','+g+','+b+')'
    context.lineCap = 'round'
    context.lineWidth = weight
    context.beginPath()
    context.moveTo((lastX||x), (lastY||y))
    context.lineTo(x, y)
    context.stroke()

    if (i % 2 === 0)
      lastX = x
    else
      lastY = y
  }
}

function fill2 (v) {
  if (v.length === 1)
    return '0'+v
  return v
}
module.exports.hexpride = function (canvas, buf) {
  buf = toArrayBuffer(buf)
  
  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf),
    blocksPerRow = Math.ceil(Math.sqrt(bytes.length)),
    blockWidth = width / blocksPerRow,
    blockHeight = height / blocksPerRow

  var i = 0
  function getByte () {
    return bytes[i++]
  }

  context.fillStyle = '#000'
  context.fillRect(0, 0, width, height)
  context.font = ((blockWidth|0) - 6)+'px monospace'
  context.textBaseline = 'top'
  for (var y = 0; i < bytes.length; y++) {
    for (var x = 0; x < blocksPerRow && i < bytes.length; x++) {
      var byte = getByte()
      var hue = (byte / 255 * 360)|0
      context.fillStyle = 'hsl('+hue+', 50%, 30%)'
      context.fillText(fill2(byte.toString(16)), x*blockWidth, y*blockHeight)
    }
  }
}

module.exports.sosquare = function (canvas, buf) {
  buf = toArrayBuffer(buf)
  
  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf),
    blocksPerRow = Math.ceil(Math.sqrt(bytes.length)),
    blockWidth = width / blocksPerRow,
    blockHeight = height / blocksPerRow

  var i = 0
  function getByte () {
    return bytes[i++]
  }

  for (var y = 0; i < bytes.length; y++) {
    for (var x = 0; x < blocksPerRow && i < bytes.length; x++) {
      var byte = getByte()
      var s = byte / 255
      var hue = (s * 360)|0
      var nw = blockWidth * s
      var nh = blockHeight * s
      var nx = x*blockWidth + (blockWidth - nw)/2
      var ny = y*blockHeight + (blockHeight - nh)/2
      // context.fillStyle = 'hsl('+hue+', 80%, 95%)'
      context.fillStyle = 'hsl('+hue+', 50%, 30%)'
      context.fillRect(nx, ny, nw, nh)
      // context.strokeStyle = 'hsl('+hue+', 50%, 30%)'
      context.strokeStyle = '#000'
      context.strokeRect(nx, ny, nw, nh)
    }
  }
}

module.exports.innerCircles = function (canvas, buf) {
  buf = toArrayBuffer(buf)

  var context = canvas.getContext && canvas.getContext('2d'),
    width = canvas.width,
    height = canvas.height,
    bytes = new Uint8ClampedArray(buf),
    blocksPerRow = Math.ceil(Math.sqrt(bytes.length)),
    blockWidth = width / blocksPerRow,
    blockHeight = height / blocksPerRow

  var floats = []
  bytes.forEach(function (byte) {
    floats.push(byte/255)
  })

  var r = bytes[0]
  var g = bytes[1]
  var b = bytes[2]

  var d = width/2
  var x = width/2
  var y = height/2

  context.fillStyle = 'rgb('+[r, g, b].join(',')+')'
  circle(context, x, y, d)

  for (var i = 0; i < 6; i++) {
    var iStart = 2 + (i * 4)
    var rMod = Math.round( (floats[iStart + 1] - 0.5) * 255/1 )
    var gMod = Math.round( (floats[iStart + 2] - 0.5) * 255/1 )
    var bMod = Math.round( (floats[iStart + 3] - 0.5) * 255/1 )
    var theta = floats[iStart + 4] * Math.PI * 2

    var dMod = -1 * width/16

    var radius = dMod/2
    var cart = polarToCart(radius, theta)

    d += dMod

    x = cart.x + width/2
    y = cart.y + height/2

    r += rMod
    g += gMod
    b += bMod

    r = Math.abs(r)
    g = Math.abs(g)
    b = Math.abs(b)

    context.fillStyle = 'rgb('+[r, g, b].join(',')+')'
    circle(context, x, y, d)
  }
}

function circle (ctx, x, y, d) {
  var r = d/2
  ctx.beginPath()
  ctx.arc(x, y, d, 0, 2 * Math.PI, false)
  ctx.fill()
  ctx.closePath()
}

function polarToCart (radius, theta) {
  return {
    x: radius * Math.cos(theta),
    y: radius * Math.sin(theta)
  }
}
