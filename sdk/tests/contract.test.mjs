import test from 'node:test';
import assert from 'node:assert/strict';
import { ExternalClient, ExternalOperationError } from '@pbt/sdk/external';

const state = (changes = {}) => ({ runId:'run', sessionId:'session', state:'running',
  paid:false, payments:[], printJobs:[], photos:[], commands:[], ...changes });
test('context keeps rubles and uses the public relative API', async () => {
  const client = new ExternalClient(async (url, init) => {
    assert.equal(url, '/api/v1/external/runtime/context');
    assert.equal(init.credentials, 'same-origin');
    return Response.json({ price:235.67, sheetPrice:100 });
  });
  assert.deepEqual(await client.context(), { price:235.67, sheetPrice:100 });
});
test('unknown submission outcome preserves requestId for an identical caller retry', async () => {
  const commands = [];
  const client = new ExternalClient(async (url, init) => {
    if (url.endsWith('/commands')) {
      commands.push(JSON.parse(init.body));
      if (commands.length === 1) throw new Error('response lost');
      return Response.json({ requestId:'same', state:'pending' });
    }
    return Response.json(state({ commands:[{ requestId:'same', state:'done', result:{ photoId:'ph_one' } }] }));
  });
  await assert.rejects(client.capture({ requestId:'same' }), (error) => error instanceof ExternalOperationError && error.code === 'transport' && error.requestId === 'same');
  assert.equal((await client.capture({ requestId:'same' })).photoId, 'ph_one');
  assert.deepEqual(commands[0], commands[1]);
});
test('waitPayment reads the requested payment rather than the old paid flag', async () => {
  const client = new ExternalClient(async (_url, init) => {
    assert.equal(init.method, 'GET');
    return Response.json(state({ paid:true, payments:[
      { operationId:'old', status:'completed', amountDue:1, amountPaid:1 },
      { operationId:'new', status:'declined', amountDue:100, amountPaid:0 },
    ] }));
  });
  await assert.rejects(client.waitPayment('new'), (error) => error.code === 'failed' && error.operationId === 'new');
});
test('partial print is never successful and waitPrint creates no job', async () => {
  const client = new ExternalClient(async (_url, init) => {
    assert.equal(init.method, 'GET');
    return Response.json(state({ printJobs:[{ jobId:'job', phase:'done', copies:2, copiesDone:1 }] }));
  });
  await assert.rejects(client.waitPrint('job'), (error) => error.code === 'failed' && error.result.copiesDone === 1);
});
test('complete does not poll a runtime revoked after acknowledgement', async () => {
  let calls = 0;
  const client = new ExternalClient(async (url) => {
    calls++; assert.ok(url.endsWith('/commands'));
    return Response.json({ requestId:'finish', state:'done' });
  });
  assert.equal((await client.complete({ requestId:'finish' })).state, 'done');
  assert.equal(calls, 1);
});
test('exit accepts a string requestId and refund acknowledgement is not bank confirmation', async () => {
  const commands = [];
  const client = new ExternalClient(async (_url, init) => {
    const command = JSON.parse(init.body); commands.push(command);
    return Response.json({ requestId:command.request_id, state:'pending' });
  });
  assert.equal((await client.exit('exit-id')).state, 'pending');
  assert.equal(commands[0].request_id, 'exit-id');
  assert.equal((await client.requestRefund({ requestId:'refund-id' })).state, 'pending');
  assert.equal(commands[1].action, 'refund');
});
test('binary upload retry reuses exact bytes and caller requestId', async () => {
  const jpeg = new Blob([new Uint8Array([255,216,255,217])], { type:'image/jpeg' });
  let attempts = 0;
  const client = new ExternalClient(async (_url, init) => {
    attempts++; assert.equal(init.body, jpeg); assert.equal(init.headers['X-Request-Id'], 'upload');
    if (attempts === 1) throw new Error('response lost');
    return Response.json({ photoId:'ph_upload', url:'/own/photo' });
  });
  await assert.rejects(client.upload(jpeg, 'upload'), /response lost/);
  assert.equal((await client.upload(jpeg, 'upload')).photoId, 'ph_upload');
});
test('HTTP rejection of a submitted command remains transport in the current SDK', async () => {
  const client = new ExternalClient(async () => Response.json({ error:{ code:'forbidden', message:'Denied' } }, { status:403 }));
  await assert.rejects(client.submit({ request_id:'denied', action:'capture' }), (error) => error.code === 'transport' && error.requestId === 'denied');
});
test('capture, print and share are bound to caller identifiers', async () => {
  const expected = [
    { request_id:'capture', action:'capture', camera:'side' },
    { request_id:'print', action:'print', photo_id:'ph_one', copies:2, cut:true },
    { request_id:'share', action:'share', photo_ids:['ph_one','ph_two'] },
  ];
  const client = new ExternalClient(async (url, init) => {
    if (url.endsWith('/commands')) {
      const body = JSON.parse(init.body); assert.deepEqual(body, expected.shift());
      return Response.json({ requestId:body.request_id, state:'pending' });
    }
    return Response.json(state({
      commands:[{ requestId:'capture', state:'done', result:{ photoId:'ph_one' } },
        { requestId:'print', state:'done', result:{ jobId:'job', phase:'queued' } },
        { requestId:'share', state:'done', result:{ downloadUrl:'https://photos.example/share', qrUrl:'/qr', photosCount:2 } }],
      printJobs:[{ jobId:'job', phase:'done', copies:2, copiesDone:2 }],
    }));
  });
  await client.capture({ requestId:'capture', camera:'side' });
  await client.print('ph_one', 2, { requestId:'print', cut:true });
  assert.equal((await client.share(['ph_one','ph_two'], { requestId:'share' })).photosCount, 2);
  assert.equal(expected.length, 0);
});
