import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { once } from 'events';
import { createApp, buildHirePayload } from '../src/app.js';

dotenv.config();

async function main() {
  const shouldMock = process.env.MOCK_UKG === 'true';
  let nock;
  let scope;

  if (shouldMock) {
    nock = (await import('nock')).default;
    nock.cleanAll();
    nock.disableNetConnect();
    nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'));
  }

  const { app } = createApp();
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const formPayload = {
    employeeId: `E2E-${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    preferredName: 'Tester',
    email: 'test.user@example.com',
    phone: '555-0101',
    jobTitle: 'QA Analyst',
    department: 'Quality Assurance',
    startDate: new Date().toISOString().slice(0, 10),
    location: 'Remote',
  };

  if (shouldMock) {
    const base = process.env.UKG_BASE_URL || 'https://rental4.ultipro.com';
    const path = process.env.UKG_HIRE_PATH || '/api/v1/personnel/hire';
    scope = nock(base)
      .post(path, buildHirePayload(formPayload))
      .reply(201, {
        message: 'Mock hire created successfully.',
        employeeId: formPayload.employeeId,
      });
  }

  try {
    const response = await fetch(`${baseUrl}/api/hire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formPayload),
    });

    const text = await response.text();
    let body;

    try {
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      body = { raw: text };
    }

    if (!response.ok) {
      console.error('Hire submission failed.');
      console.error(body);
      process.exitCode = 1;
    } else {
      console.log('Hire submission succeeded.');
      console.log(JSON.stringify(body, null, 2));
    }

    if (scope) {
      scope.done();
    }
  } catch (error) {
    console.error('Error exercising end-to-end hire flow.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await new Promise((resolve) => server.close(resolve));

    if (nock) {
      nock.cleanAll();
      nock.enableNetConnect();
    }
  }
}

main();
