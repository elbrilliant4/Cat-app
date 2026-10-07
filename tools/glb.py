"""Minimal GLB reader/writer for the asset tools (no dependencies beyond numpy)."""
import json, struct
import numpy as np

COMP = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read(path):
    data = open(path, 'rb').read()
    jl = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + jl])
    bl = struct.unpack_from('<I', data, 20 + jl)[0]
    binary = bytearray(data[28 + jl:28 + jl + bl])
    return gltf, binary


def accessor(gltf, binary, i):
    a = gltf['accessors'][i]
    bv = gltf['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = NCOMP[a['type']]
    arr = np.frombuffer(bytes(binary[off:off + a['count'] * n * np.dtype(COMP[a['componentType']]).itemsize]), COMP[a['componentType']])
    return arr.reshape(-1, n) if n > 1 else arr


def image_bytes(gltf, binary, i):
    bv = gltf['bufferViews'][gltf['images'][i]['bufferView']]
    off = bv.get('byteOffset', 0)
    return bytes(binary[off:off + bv['byteLength']])


def replace_image(gltf, binary, i, new_bytes, mime=None):
    """Rebuilds the binary chunk with image i's bytes replaced."""
    target = gltf['images'][i]['bufferView']
    out = bytearray()
    for k, bv in enumerate(gltf['bufferViews']):
        off = bv.get('byteOffset', 0)
        chunk = new_bytes if k == target else bytes(binary[off:off + bv['byteLength']])
        while len(out) % 4:
            out.append(0)
        bv['byteOffset'] = len(out)
        bv['byteLength'] = len(chunk)
        out += chunk
    while len(out) % 4:
        out.append(0)
    gltf['buffers'][0]['byteLength'] = len(out)
    if mime:
        gltf['images'][i]['mimeType'] = mime
    return out


def write(path, gltf, binary):
    js = json.dumps(gltf, separators=(',', ':')).encode()
    while len(js) % 4:
        js += b' '
    total = 12 + 8 + len(js) + 8 + len(binary)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(binary), 0x004E4942)); f.write(binary)
