import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildHirePayload(formData = {}) {
  const {
    employeeId = '',
    firstName = '',
    lastName = '',
    preferredName = '',
    email = '',
    phone = '',
    jobTitle = '',
    department = '',
    startDate = '',
    location = '',
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

function resolveConfig(options = {}) {
  const {
    baseUrl,
    hirePath,
    customerApiKey,
    userApiKey,
    username,
    password,
    fetchImpl,
    logger,
  } = options;

  return {
    baseUrl: baseUrl || process.env.UKG_BASE_URL || 'https://rental4.ultipro.com',
    hirePath: hirePath || process.env.UKG_HIRE_PATH || '/api/v1/personnel/hire',
    customerApiKey: customerApiKey || process.env.UKG_CUSTOMER_API_KEY,
    userApiKey: userApiKey || process.env.UKG_USER_API_KEY,
    username: username || process.env.UKG_USERNAME,
    password: password || process.env.UKG_PASSWORD,
    fetchImpl: fetchImpl || fetch,
    logger: logger || console,
  };
}

export function createSubmitHire(options = {}) {
  const config = resolveConfig(options);
  const {
    baseUrl,
    hirePath,
    customerApiKey,
    userApiKey,
    username,
    password,
    fetchImpl,
    logger,
  } = config;

  return async function submitHire(payload) {
    if (!customerApiKey || !userApiKey || !username || !password) {
      const error = new Error('Missing UKG credentials. Set the environment variables before submitting.');
      error.statusCode = 500;
      throw error;
    }

    const targetUrl = new URL(hirePath, baseUrl).toString();

    logger.log(`Submitting hire to ${targetUrl}`);

    const response = await fetchImpl(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        customerApiKey,
        userApiKey,
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
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
      const error = new Error(responseBody.message || response.statusText || 'UKG API responded with an error.');
      error.statusCode = response.status;
      throw error;
    }

    return {
      status: response.status,
      body: responseBody,
    };
  };
}

export function createApp(options = {}) {
  const config = resolveConfig(options);
  const { logger } = config;

  if (!config.customerApiKey || !config.userApiKey || !config.username || !config.password) {
    logger.warn(
      'Warning: UKG credentials are not fully configured. Update the environment variables before submitting requests.'
    );
  }

  const submitHire = options.submitHire || createSubmitHire(config);
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.post('/api/hire', async (req, res) => {
    try {
      const payload = buildHirePayload(req.body);
      const hireResponse = await submitHire(payload);
      res.status(hireResponse.status).json(hireResponse.body);
    } catch (error) {
      logger.error('Error submitting new hire', error);
      res.status(error.statusCode || 500).json({
        message: 'Failed to submit hire to UKG.',
        details: error.message,
      });
    }
  });

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  return { app, submitHire };
}
