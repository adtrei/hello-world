# UKG New Hire Form

This project provides a minimal Express application with a front-end form for submitting new-hire data to the UKG Pro REST API. The application collects basic employee and job details, proxies the request server-side, and forwards the payload to the configured UKG endpoint with the required API keys and credentials.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and adjust values as needed. The sample file is pre-populated with the credentials supplied in the task prompt.

   ```bash
   cp .env.example .env
   ```

   Update `UKG_HIRE_PATH` if your tenant uses a different resource path for the hire endpoint.

3. Start the development server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser, fill out the form, and submit it to send the data to UKG.

### Test the direct UKG connection

Run the connectivity script to issue a sample payload directly against the configured UKG endpoint without using the browser form:

```bash
npm run test:connection
```

On success the script prints the response body returned from UKG. If the environment blocks outbound internet access you will see
an error similar to `connect ENETUNREACH` indicating the request could not reach `rental4.ultipro.com`.

## How it works

- `public/index.html` renders the form and posts the data to the Express backend.
- `public/main.js` serializes the form fields, submits them as JSON to `/api/hire`, and displays the response or any error message.
- `src/server.js` receives the form submission, builds a sample payload structure, and forwards the request to `https://rental4.ultipro.com` using the provided customer API key, user API key, and basic authentication credentials. When the backend relays a request you will see a console log such as `Submitting hire to https://rental4.ultipro.com/api/v1/personnel/hire`, confirming the request was sent directly to the UKG endpoint configured in your environment variables.
- Responses from UKG are proxied back to the browser so you can see the raw API result.

> **Note:** This sample does not validate field formats beyond the browser's built-in validation and does not include persistence. Extend the payload builder to match the exact schema expected by your UKG environment before using this in production.

## Security considerations

- Do not ship real credentials in source control. Replace the values in `.env.example` with placeholders before committing to a public repository.
- For production deployments, store secrets in a secure vault and rotate them regularly.
- Consider enforcing HTTPS, server-side validation, and audit logging as required by your organization's policies.
