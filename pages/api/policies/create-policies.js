import createSTSClient from "@/lib/api/createSTSClient";
import getAccountId from "@/lib/api/getAccountId";
import { AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  IAMClient,
  CreatePolicyCommand,
  AttachRolePolicyCommand
} from "@aws-sdk/client-iam";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // We expect org, tier, accountName, policyName, and policyDocument in the body
  const { org, tier, accountName, policyName, policyDocument } = req.body;
  console.log('body ', req.body)
  if (!org || !tier || !accountName || !policyName || !policyDocument) {
    return res
      .status(400)
      .json({ error: "Missing org, tier, accountName, policyName, or policyDocument" });
  }

  try {
    let stsClient;
    try {
      stsClient = createSTSClient(org);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    const accountId = await getAccountId(tier, accountName);
    if (!accountId) {
      return res.status(404).json({
        error: `No accountId found for accountName: ${accountName}`
      });
    }

    // Assume the member account’s role
    const roleArn = `arn:aws:iam::${accountId}:role/OrganizationAccountAccessRole`;
    console.log("Attempting to assume role for createPolicy:", roleArn);

    const assumeRoleResponse = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `SessionFor_${accountName}`
      })
    );
    const assumedCredentials = assumeRoleResponse?.Credentials;
    if (!assumedCredentials) {
      throw new Error("Failed to assume target role: No credentials received");
    }

    // Create an IAM client with the assumed credentials
    const iamClient = new IAMClient({
      region: process.env[`AWS_REGION_${org}`] || "us-east-1",
      credentials: {
        accessKeyId: assumedCredentials.AccessKeyId,
        secretAccessKey: assumedCredentials.SecretAccessKey,
        sessionToken: assumedCredentials.SessionToken
      }
    });

    // Create the new policy
    const createRes = await iamClient.send(
      new CreatePolicyCommand({
        PolicyName: policyName,
        PolicyDocument: JSON.stringify(policyDocument)
      })
    );

    // Attach the policy to the role
    const policyArn = createRes.Policy.Arn;
    const roleName = `${accountName}-role`;

    await iamClient.send(
      new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: policyArn
      })
    );

    return res
      .status(200)
      .json({ message: "Policy created & attached", policyArn });
  } catch (error) {
    console.error("Create policy error:", error);
    return res.status(500).json({ error: error.message });
  }
}
