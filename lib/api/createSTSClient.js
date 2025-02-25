import { STSClient } from "@aws-sdk/client-sts";

export default function createSTSClient(org) {
  const region = process.env[`AWS_REGION_${org}`];
  const accessKeyId = process.env[`AWS_ACCESS_KEY_ID_${org}`];
  const secretAccessKey = process.env[`AWS_SECRET_ACCESS_KEY_${org}`];

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(`Missing AWS credentials for org ${org}`);
  }

  return new STSClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}