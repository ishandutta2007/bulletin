const littleEndian = !!(new Uint8Array((new Uint16Array([0x00ff])).buffer))[0]
// true