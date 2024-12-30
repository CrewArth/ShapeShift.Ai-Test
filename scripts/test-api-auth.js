const fetch = require('node-fetch');

// API endpoints
const BASE_URL = 'http://localhost:3000/api/auth';
const SIGNUP_URL = `${BASE_URL}/signup`;
const LOGIN_URL = `${BASE_URL}/login`;

// Test user data
const testUser = {
  email: 'arth@example.com',
  password: 'password123',
  name: 'Arth Vala'
};

async function testAuthAPI() {
  try {
    console.log('Starting API Authentication Test...\n');

    // Test Signup
    console.log('--- Testing Signup API ---');
    const signupResponse = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const signupData = await signupResponse.json();
    console.log('Signup Response:', {
      status: signupResponse.status,
      data: signupData
    });

    if (!signupResponse.ok) {
      throw new Error(`Signup failed: ${signupData.error}`);
    }

    console.log('Signup successful!\n');

    // Test Login
    console.log('--- Testing Login API ---');
    const loginResponse = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', {
      status: loginResponse.status,
      data: loginData
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    console.log('Login successful!');

    // Test Login with Wrong Password
    console.log('\n--- Testing Login with Wrong Password ---');
    const wrongLoginResponse = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'wrongpassword'
      })
    });

    const wrongLoginData = await wrongLoginResponse.json();
    console.log('Wrong Password Login Response:', {
      status: wrongLoginResponse.status,
      data: wrongLoginData
    });

    if (wrongLoginResponse.ok) {
      throw new Error('Security Issue: Login succeeded with wrong password!');
    }

    console.log('Wrong password correctly rejected!');

    return 'API Authentication test completed successfully';
  } catch (error) {
    console.error('\nTest failed:', error.message);
    throw error;
  }
}

// Make sure the development server is running on port 3000
console.log('Make sure your Next.js development server is running (npm run dev)');
console.log('Testing against:', BASE_URL);

testAuthAPI()
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit()); 