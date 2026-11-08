const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const xcode = require('xcode');

test('notification sound is a supported PCM WAV shorter than thirty seconds', () => {
  const audio = fs.readFileSync('assets/sounds/notification.wav');
  assert.equal(audio.toString('ascii', 0, 4), 'RIFF');
  assert.equal(audio.toString('ascii', 8, 12), 'WAVE');
  let format, dataSize;
  for (let i = 12; i + 8 <= audio.length;) {
    const id = audio.toString('ascii', i, i + 4), size = audio.readUInt32LE(i + 4);
    if (id === 'fmt ') format = { encoding: audio.readUInt16LE(i + 8), bytesPerSecond: audio.readUInt32LE(i + 16), bits: audio.readUInt16LE(i + 22) };
    if (id === 'data') dataSize = size;
    i += 8 + size + (size % 2);
  }
  assert.equal(format.encoding, 1); assert.equal(format.bits, 16);
  assert.ok(dataSize / format.bytesPerSecond > 0);
  assert.ok(dataSize / format.bytesPerSecond < 30);
});
test('OkTreat target copies the sound file into its native resources', () => {
  const project = xcode.project('ios/OkTreat.xcodeproj/project.pbxproj'); project.parseSync();
  const objects = project.hash.project.objects;
  const target = Object.values(objects.PBXNativeTarget).find(x => typeof x === 'object' && x.name === 'OkTreat');
  const phaseId = target.buildPhases.find(x => x.comment === 'Resources').value;
  const phase = objects.PBXResourcesBuildPhase[phaseId];
  const sound = phase.files.map(x => objects.PBXBuildFile[x.value]).map(x => objects.PBXFileReference[x.fileRef]).find(x => x.name === 'notification.wav');
  assert.ok(sound, 'sound must be a target resource, not only a Metro asset');
  assert.equal(sound.path.replaceAll('"', ''), '../assets/sounds/notification.wav');
});
