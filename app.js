import { createFFmpeg, fetchFile } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';

const ffmpeg = createFFmpeg({ log: true });
let cutFiles = [];

const videoInput = document.getElementById('videoInput');
const videoPreview = document.getElementById('videoPreview');
const cutBtn = document.getElementById('cutBtn');
const mergeBtn = document.getElementById('mergeBtn');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const output = document.getElementById('output');

async function loadFFmpeg() {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
}

videoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const url = URL.createObjectURL(file);
  videoPreview.src = url;
});

cutBtn.addEventListener('click', async () => {
  await loadFFmpeg();
  const file = videoInput.files[0];
  const inputName = 'input.mp4';
  const outputName = `cut_${Date.now()}.mp4`;

  ffmpeg.FS('writeFile', inputName, await fetchFile(file));

  await ffmpeg.run(
    '-i', inputName,
    '-ss', startTime.value,
    '-to', endTime.value,
    '-c', 'copy',
    outputName
  );

  const data = ffmpeg.FS('readFile', outputName);
  const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

  cutFiles.push(outputName);
  output.innerHTML += `<p>✅ Cut Saved: <a href="${url}" download="${outputName}">Download</a></p>`;
});

mergeBtn.addEventListener('click', async () => {
  await loadFFmpeg();

  if (cutFiles.length < 2) {
    alert("Need at least 2 cuts to merge.");
    return;
  }

  // Create concat list file
  const concatList = cutFiles.map(name => `file '${name}'`).join('\n');
  ffmpeg.FS('writeFile', 'list.txt', concatList);

  const mergedOutput = `merged_${Date.now()}.mp4`;

  await ffmpeg.run(
    '-f', 'concat',
    '-safe', '0',
    '-i', 'list.txt',
    '-c', 'copy',
    mergedOutput
  );

  const data = ffmpeg.FS('readFile', mergedOutput);
  const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

  output.innerHTML += `<p>🎉 Merged Video: <a href="${url}" download="${mergedOutput}">Download</a></p>`;
});
