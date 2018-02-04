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