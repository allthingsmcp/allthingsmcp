function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function view(length: number) {
  const bytes = new Uint8Array(length);
  return { bytes, data: new DataView(bytes.buffer) };
}

export function createZipArchive(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [path, contents] of Object.entries(files)) {
    const name = encoder.encode(path);
    const body = encoder.encode(contents);
    const checksum = crc32(body);
    const local = view(30);
    local.data.setUint32(0, 0x04034b50, true);
    local.data.setUint16(4, 20, true);
    local.data.setUint16(6, 0x0800, true);
    local.data.setUint16(8, 0, true);
    local.data.setUint32(14, checksum, true);
    local.data.setUint32(18, body.length, true);
    local.data.setUint32(22, body.length, true);
    local.data.setUint16(26, name.length, true);
    localParts.push(local.bytes, name, body);

    const central = view(46);
    central.data.setUint32(0, 0x02014b50, true);
    central.data.setUint16(4, 20, true);
    central.data.setUint16(6, 20, true);
    central.data.setUint16(8, 0x0800, true);
    central.data.setUint16(10, 0, true);
    central.data.setUint32(16, checksum, true);
    central.data.setUint32(20, body.length, true);
    central.data.setUint32(24, body.length, true);
    central.data.setUint16(28, name.length, true);
    central.data.setUint32(42, offset, true);
    centralParts.push(central.bytes, name);

    offset += local.bytes.length + name.length + body.length;
  }

  const centralDirectory = concat(centralParts);
  const end = view(22);
  const count = Object.keys(files).length;
  end.data.setUint32(0, 0x06054b50, true);
  end.data.setUint16(8, count, true);
  end.data.setUint16(10, count, true);
  end.data.setUint32(12, centralDirectory.length, true);
  end.data.setUint32(16, offset, true);

  return concat([...localParts, centralDirectory, end.bytes]);
}
