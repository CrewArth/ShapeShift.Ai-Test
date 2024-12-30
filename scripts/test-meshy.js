import 'dotenv/config';
import fetch from 'node-fetch';

const testMeshyAPI = async () => {
  console.log('Testing Meshy API...');
  console.log('API Key:', process.env.NEXT_PUBLIC_MESHY_API_KEY?.slice(0, 10) + '...');

  try {
    // Test text-to-3D endpoint
    console.log('\nTesting text-to-3D endpoint...');
    const response = await fetch('https://api.meshy.ai/v2/text-to-3d/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MESHY_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text: "A simple cube",
        negative_text: "low quality, bad geometry",
        style_preset: "realistic",
        format: "glb",
        turbo_mode: false,
        mode: "mesh"
      })
    });

    const data = await response.json();
    console.log('\nAPI Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\nTask created successfully!');
      console.log('Task ID:', data.task_id);

      // Check task status
      console.log('\nChecking task status...');
      const statusResponse = await fetch(`https://api.meshy.ai/v2/tasks/${data.task_id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MESHY_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      const statusData = await statusResponse.json();
      console.log('Status Response:', JSON.stringify(statusData, null, 2));
    } else {
      console.error('\nAPI Error:', data);
      console.error('Response Status:', response.status);
      console.error('Response Headers:', Object.fromEntries(response.headers));
    }

  } catch (error) {
    console.error('\nError testing API:', error);
  }
};

// Run the test
testMeshyAPI(); 