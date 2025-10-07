import dotenv from 'dotenv';
import { buildHirePayload, createSubmitHire } from '../src/app.js';

dotenv.config();

const UKG_BASE_URL = process.env.UKG_BASE_URL || 'https://rental4.ultipro.com';
const UKG_HIRE_PATH = process.env.UKG_HIRE_PATH || '/api/v1/personnel/hire';

const submitHire = createSubmitHire();

const payload = buildHirePayload({
  employeeId: 'connectivity-check',
  firstName: 'Connectivity',
  lastName: 'Check',
  preferredName: 'Connectivity',
  email: 'connectivity.check@example.com',
  phone: '555-0100',
  jobTitle: 'API Connectivity Test',
  department: 'API',
  startDate: new Date().toISOString().slice(0, 10),
  location: 'Remote',
});

async function testConnection() {
  const targetUrl = new URL(UKG_HIRE_PATH, UKG_BASE_URL).toString();
  console.log(`Attempting to submit connectivity check to ${targetUrl}`);

  try {
    const { status, body } = await submitHire(payload);
    console.log(`Successfully reached UKG. Status: ${status}`);
    console.log(body && Object.keys(body).length ? JSON.stringify(body, null, 2) : '<empty>');
  } catch (error) {
    console.error('Failed to reach UKG API.');
    console.error(error);
    process.exitCode = 1;
  }
}

testConnection();
