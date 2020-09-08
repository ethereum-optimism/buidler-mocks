export const toHexString = (buf: Buffer): string => {
  return '0x' + buf.toString('hex')
}

export const fromHexString = (str: string): Buffer => {
  return Buffer.from(str.slice(2), 'hex')
}
