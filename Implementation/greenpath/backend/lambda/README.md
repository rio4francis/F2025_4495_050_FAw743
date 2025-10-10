# Lambda: /agg endpoint
This folder mirrors the AWS Lambda code deployed behind API Gateway.
- Uses AWS Secrets Manager for DB credentials
- Connects to Postgres and returns aggregated emissions data (JSON)
- Adds CORS headers for browser access

Deployment source of truth currently lives in AWS Lambda console.
This copy is maintained for version control and code review.
