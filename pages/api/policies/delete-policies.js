import createSTSClient from "@/lib/api/createSTSClient";
import getAccountId from "@/lib/api/getAccountId";
import { AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  IAMClient,
  ListAttachedRolePoliciesCommand,
  DetachRolePolicyCommand,
  DeletePolicyCommand
} from "@aws-sdk/client-iam";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { org, tier, accountName, policyName } = req.body;
  if (!org || !tier || !accountName || !policyName) {
    return res
      .status(400)
      .json({ error: "Missing org, tier, accountName, or policyName" });
  }

  try {
    let stsClient;
    try {
      stsClient = createSTSClient(0);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get accountId
    const accountId = await getAccountId(tier, accountName);
    if (!accountId) {
      return res.status(404).json({
        error: `No accountId found for ${accountName}`
      });
    }

    // Assume the role in the target account
    const roleArn = `arn:aws:iam::${accountId}:role/OrganizationAccountAccessRole`;
    const assumeRes = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `DeletePolicyByName_${accountName}`
      })
    );
    const creds = assumeRes.Credentials;
    if (!creds) {
      throw new Error("No credentials from assumeRole");
    }

    // Create an IAM client with the assumed creds
    const iamClient = new IAMClient({
      region: process.env[`AWS_REGION_${org}`] || "us-east-1",
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken
      }
    });

    // List the attached managed policies
    const roleName = `${accountName}-role`;
    const listAttached = await iamClient.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );

    // Find the policy that matches policyName
    const foundPolicy = listAttached.AttachedPolicies.find(
      (p) => p.PolicyName === policyName
    );
    if (!foundPolicy) {
      return res.status(404).json({
        error: `Managed policy named '${policyName}' not found attached to ${roleName}`
      });
    }

    // We have the ARN now
    const policyArn = foundPolicy.PolicyArn;

    // Detach the policy
    await iamClient.send(
      new DetachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: policyArn
      })
    );
    // Delete the policy
    await iamClient.send(
      new DeletePolicyCommand({
        PolicyArn: policyArn
      })
    );

    console.log("Policy detached & deleted:", policyArn);
    return res.status(200).json({ message: `Policy '${policyName}' deleted` });
  } catch (error) {
    console.error("Delete policy by name error:", error);
    return res.status(500).json({ error: error.message });
  }
}
