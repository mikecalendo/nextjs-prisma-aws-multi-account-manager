import createSTSClient from "@/lib/api/createSTSClient";
import {
  AssumeRoleCommand
} from "@aws-sdk/client-sts";
import {
  IAMClient,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand
} from "@aws-sdk/client-iam";

export default async function getPolicyAndRole(org, accountName, accountId) {
  try {
    let stsClient;
    try {
      stsClient = createSTSClient(org);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    // Directly assume the member account role (this policy should be created with an IAM Identiy Center user)
    const roleArn = `arn:aws:iam::${accountId}:role/OrganizationAccountAccessRole`;

    console.log("Attempting to assume role:", roleArn);

    const assumeRoleResponse = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `SessionFor_${accountName}`,
      })
    );

    const assumedCredentials = assumeRoleResponse?.Credentials;
    if (!assumedCredentials) {
      throw new Error("Failed to assume target role: No credentials received");
    }

    // Create an IAM client using these new credentials
    const iamClient = new IAMClient({
      region: process.env[`AWS_REGION_${org}`] || "us-east-1",
      credentials: {
        accessKeyId: assumedCredentials.AccessKeyId,
        secretAccessKey: assumedCredentials.SecretAccessKey,
        sessionToken: assumedCredentials.SessionToken
      }
    });

    // List and get inline + attached policies for <accountName>-role
    const roleName = `${accountName}-role`;

    const inlinePolicies = [];
    const listInline = await iamClient.send(
      new ListRolePoliciesCommand({ RoleName: roleName })
    );
    for (const policyName of listInline.PolicyNames) {
      const inlinePolicyRes = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName
        })
      );
      const decoded = decodeURIComponent(inlinePolicyRes.PolicyDocument);
      inlinePolicies.push({
        policyName,
        policyDocument: JSON.parse(decoded)
      });
    }

    // Attached policies
    const attachedPolicies = [];
    const listAttached = await iamClient.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );
    for (const attached of listAttached.AttachedPolicies) {
      const policyInfo = await iamClient.send(
        new GetPolicyCommand({ PolicyArn: attached.PolicyArn })
      );
      const defaultVersionId = policyInfo.Policy.DefaultVersionId;

      const versionRes = await iamClient.send(
        new GetPolicyVersionCommand({
          PolicyArn: attached.PolicyArn,
          VersionId: defaultVersionId
        })
      );
      const doc = decodeURIComponent(versionRes.PolicyVersion.Document);

      attachedPolicies.push({
        policyName: attached.PolicyName,
        policyArn: attached.PolicyArn,
        policyDocument: JSON.parse(doc)
      });
    }

    console.log('Fetched Policy Data:', {
      accountName,
      inlinePolicies,
      attachedPolicies
    });

    return {
      accountName,
      inlinePolicies,
      attachedPolicies
    };
  } catch (error) {
    console.error("Error during getPolicyAndRole:", error);
    throw error;
  }
}
