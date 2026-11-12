# Prints the landmarks the bone table needs, read off a model (facing +z).
import sys,io; sys.path.insert(0,sys.path[0])
from glb import *; import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
j,b,P,UV,I=load(sys.argv[1])
print('verts',len(P),'tris',len(I),'bbox',P.min(0).round(3),P.max(0).round(3))
m=j['materials'][0]; src=j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']; bv=j['bufferViews'][j['images'][src]['bufferView']]
img=np.asarray(Image.open(io.BytesIO(b[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']])).convert('RGB').resize((2048,2048))).astype(float)/255
H,W,_=img.shape; c=img[np.clip((UV[:,1]*H).astype(int),0,H-1),np.clip((UV[:,0]*W).astype(int),0,W-1)]; r,g,bl=c.T
zf=P[:,2].max()
blue=(bl>r*1.25)&(bl>0.25)&(P[:,2]>zf-0.25)
for s,name in [(1,'eyeL'),(-1,'eyeR')]:
    q=P[blue&(P[:,0]*s>0)]
    if len(q): print(name,len(q),q.mean(0).round(3),'min',q.min(0).round(3),'max',q.max(0).round(3))
pink=(r>g*1.25)&(r>0.55)&(P[:,2]>zf-0.1)&(abs(P[:,0])<0.04); q=P[pink]
if len(q): print('nose',len(q),q.mean(0).round(3),q.min(0).round(3),q.max(0).round(3))
for z in np.arange(-0.65,zf,0.1):
    q=P[abs(P[:,2]-z)<0.02]; mid=q[abs(q[:,0])<0.04]
    if len(mid): print(f'z {z:+.2f} top {mid[:,1].max():+.2f} bottom {mid[:,1].min():+.2f} halfwidth {abs(q[:,0]).max():.2f}')
gy=P[:,1].min()
for y in np.arange(gy+0.02,gy+0.4,0.06):
    q=P[abs(P[:,1]-y)<0.012]; out=[]
    for name,mm in [('F',(q[:,2]>0.1)&(q[:,0]>0)),('H',(q[:,2]<0.1)&(q[:,0]>0)&(q[:,2]>-0.6))]:
        k=q[mm]
        if len(k): out.append(f"{name} x[{k[:,0].min():.2f},{k[:,0].max():.2f}] z[{k[:,2].min():.2f},{k[:,2].max():.2f}]")
    print(f'y {y:+.2f}',' | '.join(out))
t=P[(P[:,1]>0.12)&(P[:,2]<-0.2)]
for y in np.arange(0.15,P[:,1].max(),0.07):
    q=t[abs(t[:,1]-y)<0.03]
    if len(q): print(f'tail y {y:.2f} z[{q[:,2].min():+.2f},{q[:,2].max():+.2f}] xw {abs(q[:,0]).max():.2f}')
f=P[(P[:,2]>0.3)]
for s in (1,-1):
    e=f[f[:,0]*s>0.05]; i=e[:,1].argmax(); print('ear tip',e[i].round(3))
hd=P[P[:,2]>zf-0.3]; print('front-most z by y:',[(round(y,2),round(float(hd[abs(hd[:,1]-y)<0.015][:,2].max()),2)) for y in np.arange(0.05,0.5,0.05) if (abs(hd[:,1]-y)<0.015).any()])
