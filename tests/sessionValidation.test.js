import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionValidation } from '../src/services/sessionValidation.js';
function setup(read, timeoutMs=20) {
 const users=[],errors=[];let settled=0;
 const monitor=createSessionValidation({read,timeoutMs,onUser:u=>users.push(u),onError:e=>errors.push(e),onSettled:()=>settled++});
 return {monitor,users,errors,get settled(){return settled;}};
}
test('unresponsive auth leaves loading, keeps data and permits retry',async()=>{
 let resolve;let next=()=>new Promise(r=>resolve=r);
 const s=setup(()=>next());await s.monitor.refresh();
 assert.equal(s.settled,1);assert.match(s.errors.at(-1),/tardó demasiado/);assert.equal(s.users.length,0);
 next=async()=>({id:'kevin'});await s.monitor.refresh();resolve({id:'stale'});await Promise.resolve();
 assert.deepEqual(s.users,[{id:'kevin'}]);assert.equal(s.errors.at(-1),'');s.monitor.dispose();
});
test('rejected auth exits loading without erasing the current user',async()=>{
 const s=setup(async()=>{throw new Error('Sin red');});await s.monitor.refresh();
 assert.equal(s.settled,1);assert.equal(s.errors.at(-1),'Sin red');assert.deepEqual(s.users,[]);
});
test('logout invalidates an in-flight validation',async()=>{
 let resolve;const s=setup(()=>new Promise(r=>resolve=r));const task=s.monitor.refresh();await Promise.resolve();
 s.monitor.signedOut();resolve({id:'stale'});await task;assert.deepEqual(s.users,[null]);
});
test('unmount cancels validation callbacks',async()=>{
 const s=setup(()=>new Promise(()=>{}));const task=s.monitor.refresh();s.monitor.dispose();await task;
 assert.equal(s.settled,0);assert.deepEqual(s.users,[]);assert.deepEqual(s.errors,[]);
});
