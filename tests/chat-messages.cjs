const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const load = () => import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('src/utils/chatMessages.js', 'utf8')).toString('base64'));

test('latest API page opens with the newest message at the bottom without mutating the response', async () => {
  const { chronologicalMessages } = await load();
  const page = Array.from({ length: 50 }, (_, i) => ({ id: 100-i, createdAt: new Date(Date.UTC(2026,10,8,0,100-i)).toISOString(), content: 'message '+(100-i) }));
  const displayed = chronologicalMessages(page);
  assert.equal(displayed.length, 50);
  assert.equal(displayed[0].id, 51);
  assert.equal(displayed.at(-1).id, 100);
  assert.equal(page[0].id, 100);
  assert.equal(displayed.at(-1).content, 'message 100');
});
test('late socket deliveries stay in chronological order and equal timestamps stay stable', async () => {
  const { chronologicalMessages } = await load();
  const messages = [
    { id: 'newest', createdAt: '2026-11-08T03:40:00Z' },
    { id: 'earlier', createdAt: '2026-11-08T03:39:00Z' },
    { id: 'same-time', createdAt: '2026-11-08T03:40:00Z' },
  ];
  assert.deepEqual(chronologicalMessages(messages).map(m=>m.id), ['earlier','newest','same-time']);
  assert.deepEqual(chronologicalMessages([]), []);
});
