import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const UKG_BASE_URL = process.env.UKG_BASE_URL || 'https://rental4.ultipro.com';
const UKG_HIRE_PATH = process.env.UKG_HIRE_PATH || '/api/v1/personnel/hire';
const UKG_CUSTOMER_API_KEY = process.env.UKG_CUSTOMER_API_KEY;
const UKG_USER_API_KEY = process.env.UKG_USER_API_KEY;
const UKG_USERNAME = process.env.UKG_USERNAME;
const UKG_PASSWORD = process.env.UKG_PASSWORD;

if (!UKG_CUSTOMER_API_KEY || !UKG_USER_API_KEY || !UKG_USERNAME || !UKG_PASSWORD) {
  console.warn(
    'Warning: UKG credentials are not fully configured. Update the environment variables before submitting requests.'
  );
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/hire', async (req, res) => {
  try {
    const payload = buildHirePayload(req.body);
    const hireResponse = await submitHire(payload);
    res.status(hireResponse.status).json(hireResponse.body);
  } catch (error) {
    console.error('Error submitting new hire', error);
    res.status(error.statusCode || 500).json({
      message: 'Failed to submit hire to UKG.',
      details: error.message,
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

function buildHirePayload(formData) {
  const {
    employeeId,
    firstName,
    lastName,
    preferredName,
    email,
    phone,
    jobTitle,
    department,
    startDate,
    location,
  } = formData;

  return {
    employeeId,
    person: {
      firstName,
      lastName,
      preferredName,
      contact: {
        email,
        phone,
      },
    },
    position: {
      jobTitle,
      department,
      location,
    },
    workSchedule: {
      startDate,
    },
  };
}

async function submitHire(payload) {
  if (!UKG_CUSTOMER_API_KEY || !UKG_USER_API_KEY || !UKG_USERNAME || !UKG_PASSWORD) {
    const err = new Error('Missing UKG credentials. Set the environment variables before submitting.');
    err.statusCode = 500;
    throw err;
  }

  const targetUrl = new URL(UKG_HIRE_PATH, UKG_BASE_URL).toString();

  console.log(`Submitting hire to ${targetUrl}`);

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

  const responseText = await response.text();
  let responseBody;

  try {
    responseBody = responseText ? JSON.parse(responseText) : {};
  } catch (parseError) {
    responseBody = { raw: responseText };
  }

  if (!response.ok) {
    const error = new Error('UKG API responded with an error.');
    error.statusCode = response.status;
    error.message = responseBody.message || response.statusText;
    throw error;
  }

  return {
    status: response.status,
    body: responseBody,
  };
}
