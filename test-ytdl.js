import ytdl from 'ytdl-core';

const YTDL_NO_UPDATE = '1';

async function test() {
  console.log('Testing ytdl-core...');
  try {
    const info = await ytdl.getInfo('https://www.youtube.com/watch?v=jNQXAC9IVRw');
    console.log('Title:', info.videoDetails.title);
    console.log('Duration:', info.videoDetails.lengthSeconds, 'seconds');
    console.log('Success!');
  } catch (err) {
    console.log('Error:', err.message);
  }
  process.exit(0);
}

test();
