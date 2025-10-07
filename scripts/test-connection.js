import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const UKG_BASE_URL = process.env.UKG_BASE_URL || 'https://rental4.ultipro.com';
const UKG_HIRE_PATH = process.env.UKG_HIRE_PATH || '/api/v1/personnel/hire';
const UKG_CUSTOMER_API_KEY = process.env.UKG_CUSTOMER_API_KEY;
const UKG_USER_API_KEY = process.env.UKG_USER_API_KEY;
const UKG_USERNAME = process.env.UKG_USERNAME;
const UKG_PASSWORD = process.env.UKG_PASSWORD;

if (!UKG_CUSTOMER_API_KEY || !UKG_USER_API_KEY || !UKG_USERNAME || !UKG_PASSWORD) {
  console.error('Missing one or more UKG credentials. Populate the environment variables before testing.');
  process.exitCode = 1;
  process.exit();
}

const targetUrl = new URL(UKG_HIRE_PATH, UKG_BASE_URL).toString();

const payload = {
  employeeId: 'connectivity-check',
  person: {
    firstName: 'Connectivity',
    lastName: 'Check',
    contact: {
      email: 'connectivity.check@example.com',
      phone: '555-0100',
    },
  },
  position: {
    jobTitle: 'API Connectivity Test',
    department: 'API',
    location: 'Remote',
  },
  workSchedule: {
    startDate: new Date().toISOString().slice(0, 10),
  },
};

async function testConnection() {
  console.log(`Attempting to submit connectivity check to ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        customerApiKey: UKG_CUSTOMER_API_KEY,
        userApiKey: UKG_USER_API_KEY,
        Authorization: `Basic ${Buffer.from(`${UKG_USERNAME}:${UKG_PASSWORD}`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(`UKG API responded with status ${response.status}. Body: ${text || '<empty>'}`);
      process.exitCode = 1;
      return;
    }

    console.log('Successfully reached UKG. Response body:');
    console.log(text || '<empty>');
  } catch (error) {
    console.error('Failed to reach UKG API.');
    console.error(error);
    process.exitCode = 1;
  }
}

testConnection();
