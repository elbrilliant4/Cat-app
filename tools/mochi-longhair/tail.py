# Gives the long-haired Mochi a believable tail under her fur. Meshy made the
# tail a club: a trunk as thick as her thigh with a bulb on top, flat
# underneath. This moves every point of it onto a smooth tube round a
# gently curving centre line, tapering to a rounded tip, and blends the base
# into her rump. Texture and triangles stay as they are.
#   python3 tail.py <in.glb> <out.glb>      (prints the centre line for the tail bones in cat-rig.js)
import sys,json,struct
import numpy as np
src,dst=sys.argv[1:3]
f=open(src,'rb'); head=f.read(12); n,_=struct.unpack('<I4s',f.read(8)); j=json.loads(f.read(n)); bn,_=struct.unpack('<I4s',f.read(8)); b=bytearray(f.read(bn))
pr=j['meshes'][0]['primitives'][0]
def view(i,nc):
    a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; off=bv.get('byteOffset',0)+a.get('byteOffset',0)
    return np.frombuffer(b,np.float32,a['count']*nc,off).reshape(a['count'],nc),a
P,pa=view(pr['attributes']['POSITION'],3); N,_=view(pr['attributes']['NORMAL'],3)
# The centre line (y, z; x = 0): up from the rump, arcing back, the tip level.
C=np.array([[0,.20,-.445],[0,.28,-.49],[0,.36,-.54],[0,.43,-.60],[0,.485,-.675],[0,.515,-.76],[0,.52,-.845],[0,.505,-.92]])
def resample(L,n):
    for _ in range(3):  # round the corners
        M=L.copy(); M[1:-1]=(L[:-2]+2*L[1:-1]+L[2:])/4; L=M
    d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(L,axis=0),axis=1))]; t=np.linspace(0,d[-1],n)
    return np.c_[[np.interp(t,d,L[:,k]) for k in range(3)]].T
C=resample(C,64); seg=np.linalg.norm(np.diff(C,axis=0),axis=1); cum=np.r_[0,np.cumsum(seg)]; LEN=cum[-1]
t0=(C[1]-C[0])/seg[0]
cand=np.where(((P-C[0])@t0>0)&(P[:,2]<-.3)&(P[:,1]>.12))[0]
Q=P[cand].astype(np.float64)
best=np.full(len(Q),1e9); S=np.zeros(len(Q)); near=np.zeros((len(Q),3))
for k in range(len(C)-1):
    a,ab=C[k],C[k+1]-C[k]; t=np.clip(((Q-a)@ab)/(ab@ab),0,1); c=a+t[:,None]*ab; d=np.linalg.norm(Q-c,axis=1)
    m=d<best; best[m]=d[m]; S[m]=cum[k]+t[m]*seg[k]; near[m]=c[m]
u=S/LEN
# How thick the club was along its length (to keep the layers in order), and the tube it becomes.
bins=np.clip((u*20).astype(int),0,19); old=np.array([np.percentile(best[bins==k],92) if (bins==k).sum()>10 else .1 for k in range(20)])
oldR=np.interp(u,(np.arange(20)+.5)/20,old)
R=.024+.03*(1-u)**.8+.016*np.sin(np.pi*np.clip(u,0,1))**2     # base .054, fullest .056 near the middle, tip .024
fl=np.clip(u/.2,0,1); R=R+.028*(1-fl*fl*(3-2*fl))               # flared at the base, to the width of her rump there
q=np.clip(best/np.maximum(oldR,1e-4),0,1.3)
newr=R*(.55+.45*np.minimum(q,1))                                # inner layers stay inside the outer ones
rad=(Q-near)/np.maximum(best,1e-6)[:,None]
rad[best<1e-5]=[0,1,0]                                           # (a point on the line itself: any way out)
target=near+rad*newr[:,None]
w=np.clip(u/.05,0,1); w=w*w*(3-2*w)                             # only the first few centimetres keep her rump's own shape
out=Q*(1-w[:,None])+target*w[:,None]
nn=N[cand]*(1-w[:,None])+rad*w[:,None]; nn/=np.maximum(np.linalg.norm(nn,axis=1,keepdims=True),1e-9)
P2=P.copy(); N2=N.copy(); P2[cand]=out.astype(np.float32); N2[cand]=nn.astype(np.float32)
# Round the tail's root, her rump is carved into spikes of fur (and has loose
# flecks of it): smoothed over, so the tail leaves a smooth rump and the
# fur layer does the fluff.
key=np.round(P2.astype(np.float64)/5e-4).astype(np.int64); _,first,inv=np.unique(key,axis=0,return_index=True,return_inverse=True); inv=inv.ravel()
ia=j['accessors'][pr['indices']]; ibv=j['bufferViews'][ia['bufferView']]
I=np.frombuffer(b,{5125:np.uint32,5123:np.uint16}[ia['componentType']],ia['count'],ibv.get('byteOffset',0)+ia.get('byteOffset',0)).reshape(-1,3).astype(np.int64)
W=inv[I]; nw=len(first); Pw=P2[first].astype(np.float64)
d0=np.linalg.norm(Pw-C[0],axis=1); uw=np.zeros(nw); uw[inv[cand]]=u
region=(d0<.2)&(uw<.3)
e=np.r_[W[:,[0,1]],W[:,[1,2]],W[:,[2,0]]]; e=np.r_[e,e[:,::-1]]; e=e[region[e[:,0]]]
strength=np.clip((.2-d0)/.08,0,1)*region
for _ in range(30):
    acc=np.zeros((nw,3)); cnt=np.zeros(nw); np.add.at(acc,e[:,0],Pw[e[:,1]]); np.add.at(cnt,e[:,0],1)
    m=cnt>0; avg=Pw.copy(); avg[m]=acc[m]/cnt[m,None]
    Pw=Pw+(avg-Pw)*(.5*strength)[:,None]
moved=np.linalg.norm(Pw-P2[first],axis=1)
P2=Pw[inv].astype(np.float32)
# normals there: from the smoothed faces
fn=np.cross(Pw[W[:,1]]-Pw[W[:,0]],Pw[W[:,2]]-Pw[W[:,0]]); vn=np.zeros((nw,3))
for k in range(3): np.add.at(vn,W[:,k],fn)
vn/=np.maximum(np.linalg.norm(vn,axis=1,keepdims=True),1e-12)
sm=(strength>0)&(uw<.05)
N2=N2.copy(); msk=sm[inv]; N2[msk]=(N2[msk]*(1-strength[inv][msk,None])+vn[inv][msk]*strength[inv][msk,None]).astype(np.float32)
N2/=np.maximum(np.linalg.norm(N2,axis=1,keepdims=True),1e-9)
print('rump round the tail smoothed: %d points, by up to %.3f'%(int((moved>1e-4).sum()),moved.max()))
for arr,key in ((P2,'POSITION'),(N2,'NORMAL')):
    a=j['accessors'][pr['attributes'][key]]; bv=j['bufferViews'][a['bufferView']]; off=bv.get('byteOffset',0)+a.get('byteOffset',0)
    b[off:off+arr.nbytes]=arr.tobytes()
pa['min']=P2.min(0).tolist(); pa['max']=P2.max(0).tolist()
js=json.dumps(j,separators=(',',':')).encode(); js+=b' '*((4-len(js)%4)%4)
open(dst,'wb').write(struct.pack('<4sII',b'glTF',2,28+len(js)+len(b))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(b),b'BIN\0')+bytes(b))
print('tail points moved',len(cand),'length %.3f'%LEN,'moved by up to %.3f'%np.linalg.norm(out-Q,axis=1).max())
B=resample(C,8)
print('bones tail1..tail7 and the tip:'); print('\n'.join('  V(0, %.3f, %.3f)'%(p[1],p[2]) for p in B))
