const axios = require('axios');

const taskId = '0193ba05-2d65-7d14-8dd2-c8b9d29e1773';
const apiKey = 'msy_yrk9ao4ubwc40K6Cun7J3bLvuTLYpbC0w9jX';

async function checkStatus() {
  try {
    console.log('Checking task status...');
    const response = await axios.get(
      `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }
    );
    console.log('Task Status:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error Details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
  }
}

// Also create a new task to test
async function createNewTask() {
  try {
    console.log('Creating new task...');
    const response = await axios.post(
      'https://api.meshy.ai/openapi/v1/image-to-3d',
      {
        // Using a sample image URL for testing
        image_url: 'https://docs.meshy.ai/img/meshy-api-example-input.png',
        ai_model: 'meshy-4',
        topology: 'quad',
        target_polycount: 30000,
        should_remesh: true,
        enable_pbr: true
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('New Task Created:', JSON.stringify(response.data, null, 2));
    return response.data.result;
  } catch (error) {
    console.error('Error Creating Task:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
  }
}

// Run both functions
async function run() {
  console.log('1. Checking existing task status...');
  await checkStatus();
  
  console.log('\n2. Creating new task...');
  const newTaskId = await createNewTask();
  
  if (newTaskId) {
    console.log('\n3. Checking new task status...');
    // Wait 2 seconds before checking status
    await new Promise(resolve => setTimeout(resolve, 2000));
    taskId = newTaskId;
    await checkStatus();
  }
}

run(); 