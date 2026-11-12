# Warms the coat of a model's base colour toward the character sheet's cream
# (the Meshy model came out grey-white), leaving the blue of the eyes and the
# pink of the nose alone.   python3 warm.py <in.glb> <out.glb> [jpeg size]
import sys,io,json,struct
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
src,dst=sys.argv[1:3]; size=int(sys.argv[3]) if len(sys.argv)>3 else None
f=open(src,'rb'); f.read(12); n,_=struct.unpack('<I4s',f.read(8)); j=json.loads(f.read(n)); bn,_=struct.unpack('<I4s',f.read(8)); b=f.read(bn)
ci=j['textures'][j['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
out=bytearray(); ibv={im['bufferView']:i for i,im in enumerate(j['images'])}
for k,v in enumerate(j['bufferViews']):
    d=b[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
    if ibv.get(k)==ci:
        im=Image.open(io.BytesIO(d)).convert('RGB')
        if size: im=im.resize((size,size),Image.LANCZOS)
        a=np.asarray(im).astype(np.float32)/255; r,g,bl=a[...,0],a[...,1],a[...,2]
        lum=.3*r+.59*g+.11*bl
        keep=np.clip((bl-np.maximum(r,g))/.06,0,1)                 # eyes: blue leads
        keep=np.maximum(keep,np.clip((r-g-.12)/.08,0,1)*np.clip((bl-g+.02)/.06,0,1))  # nose, ears' inner pink
        light=np.clip((lum-.25)/.45,0,1)                             # cream fur most, brown a little
        light=light*(1-.6*np.clip((lum-.72)/.2,0,1))                 # the whitest fur (blaze, muzzle, paws) stays near white
        tint=np.stack([1+.06*light+.03*(1-light),1-.03*light*np.clip((lum-.5)/.2,0,1),1-.07*light-.04*(1-light)],-1)
        w=a*tint
        a=a*keep[...,None]+w*(1-keep[...,None])
        o=io.BytesIO(); Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)).save(o,'JPEG',quality=92,optimize=True); d=o.getvalue(); j['images'][ci]['mimeType']='image/jpeg'
    while len(out)%4: out.append(0)
    v['byteOffset']=len(out); v['byteLength']=len(d); out+=d
while len(out)%4: out.append(0)
j['buffers'][0]['byteLength']=len(out); js=json.dumps(j,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4)
open(dst,'wb').write(struct.pack('<4sII',b'glTF',2,28+len(js)+len(out))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(out),b'BIN\0')+out)
