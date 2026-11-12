# Repaints her left foreleg (x > 0) white below the elbow, as on the character
# sheet, in the model's 4K base colour, then writes the web copy (2K JPEGs).
import sys,io,json,struct; sys.path.insert(0,'.')
from glb import *; import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
SRC,WEB=sys.argv[1],sys.argv[2]
j,b,P,UV,I=load(SRC)
bv=j['bufferViews'][j['images'][1]['bufferView']]
img=np.asarray(Image.open(io.BytesIO(b[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']])).convert('RGB')).astype(np.float32)/255
H,W,_=img.shape
wv=np.clip((-0.30-P[:,1])/0.09,0,1)*(P[:,0]>0.0)*(P[:,2]>0.36)   # 1 below y=-.39, 0 above y=-.30
tri=I[(wv[I]>0).any(1)]
mask=np.zeros((H,W),np.float32)
for t in tri:
    uv=UV[t]*[W,H]; w3=wv[t]
    x0,y0=np.maximum(np.floor(uv.min(0)).astype(int)-1,0); x1,y1=np.minimum(np.ceil(uv.max(0)).astype(int)+2,[W,H])
    xs,ys=np.meshgrid(np.arange(x0,x1)+.5,np.arange(y0,y1)+.5)
    (ax,ay),(bx,by),(cx,cy)=uv; d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
    if abs(d)<1e-9: continue
    l0=((by-cy)*(xs-cx)+(cx-bx)*(ys-cy))/d; l1=((cy-ay)*(xs-cx)+(ax-cx)*(ys-cy))/d; l2=1-l0-l1
    e=-1.5/max(1,np.sqrt(abs(d)))  # a little past the edges, so seams don't show
    inside=(l0>=e)&(l1>=e)&(l2>=e)
    val=np.clip(l0*w3[0]+l1*w3[1]+l2*w3[2],0,1)
    sub=mask[y0:y1,x0:x1]; np.maximum(sub,np.where(inside,val,0),out=sub)
lum=img@np.array([.3,.59,.11],np.float32)
m=mask>.5; mean=lum[m&(lum<.5)].mean() if (m&(lum<.5)).any() else .2
dark=np.clip((.62-lum)/.25,0,1)          # only fur that isn't already white
detail=np.clip(lum/mean,.4,1.8)**.22
white=np.array([.90,.885,.86],np.float32)*detail[...,None]
k=(mask*dark)[...,None]; out=img*(1-k)+white*k
print('texels repainted',int((k[...,0]>.05).sum()),'mean brown',float(mean))
out8=Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8))
def pack(path,sizes,first):
    buf=bytearray(); jj=json.loads(json.dumps(j)); ibv={im['bufferView']:i for i,im in enumerate(jj['images'])}
    for kk,v in enumerate(jj['bufferViews']):
        d=b[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
        if kk in ibv:
            i=ibv[kk]; im=out8 if i==1 else Image.open(io.BytesIO(d)).convert('RGB')
            if sizes: im=im.resize((sizes[i][0],)*2,Image.LANCZOS)
            if sizes or i==1:
                o=io.BytesIO(); im.save(o,'JPEG',quality=sizes[i][1] if sizes else 93,optimize=True); d=o.getvalue(); jj['images'][i]['mimeType']='image/jpeg'
        while len(buf)%4: buf.append(0)
        v['byteOffset']=len(buf); v['byteLength']=len(d); buf+=d
    while len(buf)%4: buf.append(0)
    jj['buffers'][0]['byteLength']=len(buf); js=json.dumps(jj,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4)
    with open(path,'wb') as o: o.write(struct.pack('<4sII',b'glTF',2,28+len(js)+len(buf))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(buf),b'BIN\0')+buf)
pack(WEB,{0:(2048,90),1:(2048,90),2:(1024,85)},None)
