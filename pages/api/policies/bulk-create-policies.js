import createSTSClient from '@/lib/api/createSTSClient';
import getAccountId from '@/lib/api/getAccountId';
import { AssumeRoleCommand } from '@aws-sdk/client-sts';
import {
  IAMClient,
  CreatePolicyCommand,
  AttachRolePolicyCommand
} from '@aws-sdk/client-iam';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    org,
    tier,
    selectedAccounts, // e.g. [{ accountName: "acmeaccounts1_account_1" }, ...]
    policyName,
    policyDoc,
  } = req.body;

  if (!org || !tier || !selectedAccounts?.length || !policyName || !policyDoc) {
    return res.status(400).json({
      error: 'Missing org, tier, selectedAccounts, policyName, or policyDoc'
    });
  }

  try {
    // STS client from admin account
    const stsClient = createSTSClient(org);

    let createdCount = 0;
    let skippedCount = 0;

    // Loop over each selected account
    for (const { accountName } of selectedAccounts) {
      try {
        // a) fetch accountId
        const accountId = await getAccountId(tier, accountName);
        if (!accountId) {
          console.log(`No accountId found for ${accountName}, skipping...`);
          skippedCount++;
          continue;
        }

        // b) assume the role in that sub-account
        const roleArn = `arn:aws:iam::${accountId}:role/OrganizationAccountAccessRole`;
        const assumeRes = await stsClient.send(
          new AssumeRoleCommand({
            RoleArn: roleArn,
            RoleSessionName: `BulkCreate_${accountName}`
          })
        );
        const creds = assumeRes.Credentials;
        if (!creds) {
          console.log(`No credentials for ${accountName}, skipping...`);
          skippedCount++;
          continue;
        }

        // c) create an IAM client for that sub-account
        const iamClient = new IAMClient({
          region: process.env[`AWS_REGION_${org}`] || 'us-east-1',
          credentials: {
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken
          }
        });

        // d) Insert the accountId if you have <ACCOUNT_ID> placeholders
        const docClone = JSON.parse(JSON.stringify(policyDoc));
        replaceAccountId(docClone, accountId);

        // e) create the policy
        let createRes;
        try {
          createRes = await iamClient.send(
            new CreatePolicyCommand({
              PolicyName: policyName,
              PolicyDocument: JSON.stringify(docClone)
            })
          );
        } catch (err) {
          // If the policy name already exists, skip this account
          if (err.name === 'EntityAlreadyExists') {
            console.log(`Policy ${policyName} already exists in ${accountName}. Skipping...`);
            skippedCount++;
            continue;
          } else {
            // Another error: log and skip
            console.error(`Error creating policy for ${accountName}:`, err.message);
            skippedCount++;
            continue;
          }
        }

        // f) attach to the role
        const newPolicyArn = createRes.Policy.Arn;
        await iamClient.send(
          new AttachRolePolicyCommand({
            RoleName: `${accountName}-role`,
            PolicyArn: newPolicyArn
          })
        );

        console.log(`Created & attached policy ${policyName} for ${accountName}`);
        createdCount++;
      } catch (err) {
        console.error(`Error (outer) for ${accountName}:`, err.message);
        skippedCount++;
      }
    }

    return res.status(200).json({
      message: 'Bulk create done',
      createdCount,
      skippedCount
    });
  } catch (error) {
    console.error('Bulk create policies error:', error);
    return res.status(500).json({ error: error.message });
  }
}