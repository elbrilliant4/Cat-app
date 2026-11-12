import json,struct,numpy as np
def load(path):
    f=open(path,'rb'); f.read(12); n,_=struct.unpack('<I4s',f.read(8)); j=json.loads(f.read(n)); bn,_=struct.unpack('<I4s',f.read(8)); b=f.read(bn)
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; off=bv.get('byteOffset',0)+a.get('byteOffset',0)
        dt={5126:np.float32,5125:np.uint32,5123:np.uint16}[a['componentType']]; nc={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        return np.frombuffer(b,dt,a['count']*nc,off).reshape(a['count'],nc) if nc>1 else np.frombuffer(b,dt,a['count'],off)
    p=j['meshes'][0]['primitives'][0]
    return j,b,acc(p['attributes']['POSITION']),acc(p['attributes']['TEXCOORD_0']),acc(p['indices']).reshape(-1,3)
