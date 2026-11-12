# Web copy of a Meshy GLB: textures resized and saved as JPEG.
#   python3 pack.py <in.glb> <out.glb> [colour size] [normal size] [roughness size]
import sys,io,json,struct
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
src,dst=sys.argv[1:3]; sz=[int(x) for x in sys.argv[3:6]]+[2048,2048,1024][len(sys.argv)-3:]
f=open(src,'rb'); f.read(12); n,_=struct.unpack('<I4s',f.read(8)); j=json.loads(f.read(n)); bn,_=struct.unpack('<I4s',f.read(8)); b=f.read(bn)
m=j['materials'][0]; role={m['pbrMetallicRoughness']['baseColorTexture']['index']:0}
if 'normalTexture' in m: role[m['normalTexture']['index']]=1
if 'metallicRoughnessTexture' in m['pbrMetallicRoughness']: role[m['pbrMetallicRoughness']['metallicRoughnessTexture']['index']]=2
img_role={j['textures'][t]['source']:r for t,r in role.items()}
ibv={im['bufferView']:i for i,im in enumerate(j['images'])}; out=bytearray()
for k,v in enumerate(j['bufferViews']):
    d=b[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
    if k in ibv:
        i=ibv[k]; r=img_role.get(i,2); im=Image.open(io.BytesIO(d)).convert('RGB'); print('image',i,'role',r,im.size)
        im=im.resize((sz[r],sz[r]),Image.LANCZOS); o=io.BytesIO(); im.save(o,'JPEG',quality=[90,90,85][r],optimize=True); d=o.getvalue(); j['images'][i]['mimeType']='image/jpeg'
    while len(out)%4: out.append(0)
    v['byteOffset']=len(out); v['byteLength']=len(d); out+=d
while len(out)%4: out.append(0)
j['buffers'][0]['byteLength']=len(out); js=json.dumps(j,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4)
open(dst,'wb').write(struct.pack('<4sII',b'glTF',2,28+len(js)+len(out))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(out),b'BIN\0')+out)
