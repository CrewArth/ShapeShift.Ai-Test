import axios from 'axios';
import 'dotenv/config';

const API_KEY = process.env.NEXT_PUBLIC_MESHY_API_KEY;
console.log('API Key:', API_KEY?.slice(0, 10) + '...');

const testMeshyAPI = async () => {
  try {
    console.log('Testing Meshy API...');
    
    const response = await axios({
      method: 'post',
      url: 'https://api.meshy.ai/v2/text-to-3d/tasks',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        text: 'A simple cube',
        mode: 'mesh',
        format: 'glb'
      }
    });

    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
};

testMeshyAPI(); 