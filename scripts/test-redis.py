"""Exercise the production Lua limiter against an isolated Redis test instance."""
import concurrent.futures, os, socket, subprocess, uuid
port=int(os.environ.get('REDIS_TEST_PORT','6379'))
prefix='xiantu-test:{'+uuid.uuid4().hex+'}:'
script=subprocess.check_output(['node','-e',"process.stdout.write(require('./tencent-jev-function/rate-limit').ACQUIRE)"],text=True)
def command(*args):
    parts=[str(a).encode() for a in args]
    with socket.create_connection(('127.0.0.1',port),timeout=3) as s:
        s.sendall(b'*'+str(len(parts)).encode()+b'\r\n'+b''.join(b'$'+str(len(p)).encode()+b'\r\n'+p+b'\r\n' for p in parts))
        f=s.makefile('rb');line=f.readline()
        if line[:1]==b':': return int(line[1:])
        if line[:1]==b'+': return line[1:-2].decode()
        raise RuntimeError(line.decode())
keys=[prefix+'actor:'+str(i) for i in range(20)]+[prefix+'budget',prefix+'active']
def acquire(i,lease=None):return command('EVAL',script,3,keys[i],keys[-2],keys[-1],10000,4,2,lease or str(i),1)
try:
    assert acquire(0)==1 and acquire(1)==1
    assert acquire(0)==0 and acquire(2)==0
    command('ZREM',keys[-1],'0','1')
    assert acquire(0)==0, 'release must not remove actor cooldown'
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results=list(pool.map(acquire,range(2,10)))
    assert sum(results)==2, results
    command('DEL',keys[-1])
    assert acquire(10)==0, 'budget must survive lease release'
    command('DEL',keys[-2])
    command('ZADD',keys[-1],1,'expired')
    assert acquire(10)==1 and command('ZCARD',keys[-1])==1
    assert 0<command('PTTL',keys[10])<=10000
    assert 0<command('PTTL',keys[-2])<=60000
    print('PASS Redis atomic concurrency, cross-caller budget, cooldown, expired lease cleanup and bounded TTL')
finally:command('DEL',*keys)
