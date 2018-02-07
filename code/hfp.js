;(function HardwareFingerprintingModuleDefinition (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else if (typeof exports === 'object') {
    exports['hwfp'] = factory()
  } else {
    root['hwfp'] = factory()
  }
})(this, function () {
  const VERSION = '0.1.0'

  const worker = function (workerPath) {
    return new Promise(function (resolve) {
      if (!window.Worker) {
        resolve([])
      }
      let result = []
      const tasks = [1, 2, 16]
      let taskId = 0
      const workers = []
      let complete = 0
      let t0 = 0
      for (let i = 0; i < 16; i++) {
        workers[i] = new window.Worker(workerPath)
        workers[i].onmessage = function (ev) {
          if (++complete === tasks[taskId]) {
            result.push(window.performance.now() - t0)
            complete = 0
            taskId++
            if (taskId < tasks.length) {
              t0 = window.performance.now()
              for (let j = 0; j < tasks[taskId]; j++) {
                workers[j].postMessage('')
              }
            } else {
              resolve(result)
            }
          }
        }
      }
      t0 = window.performance.now()
      workers[0].postMessage('')
    })
  }

  const aes = function () {
    return new Promise(function (resolve) {
      const webcrypto = window.crypto || window.msCrypto || window.webkitCrypto
      if (!webcrypto) {
        resolve(0)
      }
      const aesAlgorithmEncrypt = {
        name: 'AES-CBC',
        iv: webcrypto.getRandomValues(new Uint8Array(16))
      }
      const raw = new Uint8Array(1024 * 1000 * 100)
      let key = ''
      let t0 = window.performance.now()

      webcrypto.subtle.generateKey({
        name: 'AES-CBC',
        length: 128
      }, false, ['encrypt', 'decrypt'])
      .then(function (cryptoKey) {
        key = cryptoKey
        return webcrypto.subtle.encrypt(aesAlgorithmEncrypt, key, raw)
      }).then(function (encrypted) {
        return webcrypto.subtle.decrypt(aesAlgorithmEncrypt, key, encrypted)
      }).then(function () {
        resolve(window.performance.now() - t0)
      })
    })
  }

  // little endian?
  const endian = !!(new Uint8Array((new Uint16Array([0x00ff])).buffer))[0]

  const memory = function () {
    return new Promise(function (resolve) {
      function calc (Uint16Size) {
        const mem = new ArrayBuffer(16 / 8 * Uint16Size)
        const m16 = new Uint16Array(mem, 0, Uint16Size)
        for (let i = 0; i < m16.length; i++) {
          m16[i] = i
        }
        const t0 = window.performance.now()
        for (let i = 0; i < 10000; i++) {
          m16.reverse()
        }
        const diff = window.performance.now() - t0
        return diff
      }
      resolve([
        calc(10),
        calc(1024),
        calc(1024 * 10),
        calc(1024 * 100)
      ])
    })
  }

  const gpu = function (canvas) {
    return new Promise(function (resolve) {
      const result = {}
      const gl = init(canvas)

      try {
        if (gl.getSupportedExtensions().indexOf('WEBGL_debug_renderer_info') >= 0) {
          result.webGLVendor = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_VENDOR_WEBGL)
          result.webGLRenderer = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)
        }
      } catch (e) {}

      function init (canvas) {
        let gl = null
        try {
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        } catch (e) {}
        return gl
      }

      resolve(result)
    })
  }

  const gpgpu = function (GPU) {
    return new Promise(function (resolve) {
      const msie = window.navigator.userAgent.indexOf('MSIE ')
      const trident = window.navigator.userAgent.indexOf('Trident/')
      if (msie > 0 || trident > 0) {
        resolve([])
      }

      const result = []
      const matrixSize = 512
      const a = splitArray(fillArrayRandom(new Array(matrixSize * matrixSize)), matrixSize)
      const b = splitArray(fillArrayRandom(new Array(matrixSize * matrixSize)), matrixSize)

      const multiply = function (gpu) {
        var options = {
          output: [matrixSize, matrixSize],
          loopMaxIterations: 1000
        }

        return gpu.createKernel(function (a, b) {
          var sum = 0
          for (var i = 0; i < 512; i++) {
            sum += a[this.thread.y][i] * b[i][this.thread.x]
          }
          return sum
        }, options)
      }

      const cpu = new GPU({ mode: 'cpu' })
      const gpu = new GPU({ mode: 'gpu' })
      const multiplyMatrix = {
        cpu: multiply(cpu),
        gpu: multiply(gpu)
      }

      let t0 = window.performance.now()
      multiplyMatrix.cpu(a, b)
      result.push(window.performance.now() - t0)

      t0 = window.performance.now()
      multiplyMatrix.gpu(a, b)
      result.push(window.performance.now() - t0)

      function fillArrayRandom (array) {
        for (var i = 0; i < array.length; i++) {
          array[i] = Math.random()
        }
        return array
      }

      function splitArray (array, part) {
        var result = []
        for (var i = 0; i < array.length; i += part) {
          result.push(array.slice(i, i + part))
        }
        return result
      }

      resolve(result)
    })
  }

  return {
    userAgent: window.navigator.userAgent,
    math: {
      'Math.tan(-1e300)': Math.tan(-1e300)
    },
    worker: worker,
    aes: aes,
    endian: endian,
    memory: memory,
    gpu: gpu,
    gpgpu: gpgpu,
    version: VERSION
  }
})