import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';

dotenv.config();
const app = express();
app.use(express.json({ limit: '10mb' }));

const {
  ACR_HOST,
  ACR_ACCESS_KEY,
  ACR_ACCESS_SECRET
} = process.env;

app.get('/', (req, res) => {
  res.send('ACRCloud backend is up and running.');
});

app.post('/identify', async (req, res) => {
  try {
    const audio = req.body.audio;
    const buffer = Buffer.from(audio, 'base64');

    const httpMethod = 'POST';
    const httpUri = '/v1/identify';
    const dataType = 'audio';
    const signatureVersion = '1';
    const timestamp = Math.floor(Date.now() / 1000);

    const stringToSign = [httpMethod, httpUri, ACR_ACCESS_KEY, dataType, signatureVersion, timestamp].join('\n');
    const signature = crypto.createHmac('sha1', ACR_ACCESS_SECRET).update(stringToSign).digest('base64');

    const formData = new FormData();
    formData.append('sample', buffer, { filename: 'sample.wav' });
    formData.append('access_key', ACR_ACCESS_KEY);
    formData.append('data_type', dataType);
    formData.append('signature_version', signatureVersion);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);

    const response = await axios.post(`https://${ACR_HOST}/v1/identify`, formData, {
      headers: formData.getHeaders()
    });

    const music = response.data.metadata?.music?.[0];
    const youtubeUrl = music?.external_metadata?.youtube?.vid
      ? `https://www.youtube.com/watch?v=${music.external_metadata.youtube.vid}`
      : null;

    res.json({ youtube: youtubeUrl });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Audio match failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
