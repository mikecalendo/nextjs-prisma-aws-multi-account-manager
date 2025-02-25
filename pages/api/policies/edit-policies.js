import createSTSClient from "@/lib/api/createSTSClient";
import getAccountId from "@/lib/api/getAccountId";
import { AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  IAMClient,
  // ListAttachedRolePoliciesCommand,
  CreatePolicyVersionCommand
} from "@aws-sdk/client-iam";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { org, tier, accountName, policyArn, policyDocument } = req.body;
  if (!org || !tier || !accountName || !policyArn || !policyDocument) {
    return res.status(400).json({
      error:
        "Missing required parameters: org, tier, accountName, policyArn, or policyDocument"
    });
  }

  try {
    const stsClient = createSTSClient(org);

    // Get the target accountId
    const accountId = await getAccountId(tier, accountName);
    if (!accountId) {
      return res
        .status(404)
        .json({ error: `No accountId found for ${accountName}` });
    }

    // Assume the role in the target account
    const roleArn = `arn:aws:iam::${accountId}:role/OrganizationAccountAccessRole`;
    const assumeRes = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `EditPolicy_${accountName}`
      })
    );
    const creds = assumeRes.Credentials;
    if (!creds) {
      throw new Error("No credentials returned from assumeRole");
    }

    // Create an IAM client with the assumed credentials
    const iamClient = new IAMClient({
      region: process.env[`AWS_REGION_${org}`] || "us-east-1",
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken
      }
    });

    // Create a new policy version and set it as the default
    const createVersionRes = await iamClient.send(
      new CreatePolicyVersionCommand({
        PolicyArn: policyArn,
        PolicyDocument: JSON.stringify(policyDocument),
        SetAsDefault: true
      })
    );

    console.log("Policy updated:", createVersionRes);
    return res
      .status(200)
      .json({
        message: `Policy '${policyArn}' updated successfully`,
        result: createVersionRes
      });
  } catch (error) {
    console.error("Edit policy error:", error);
    return res.status(500).json({ error: error.message });
  }
}
