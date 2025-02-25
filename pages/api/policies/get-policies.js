import getAccountId from '@/lib/api/getAccountId';
import getPolicyAndRole from '@/lib/api/getPolicyAndRole';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // console.log("Request received:", req.method, req.url, req.body);

  const { startAt, stopAt, org, tier } = req.body;
  if (!startAt || !stopAt || org === undefined || !tier) {
    return res.status(400).json({ error: "Missing startAt, stopAt, org, or tier" });
  }

  const start = Number(startAt);
  const stop = Number(stopAt);
  if (isNaN(start) || isNaN(stop) || start > stop) {
    return res.status(400).json({ error: "Invalid startAt or stopAt values" });
  }

  // Build the list of accounts to assume into
  const orgPrefix = process.env.ORG_UNIT_PREFIX;
  const accounts = [];

  for (let i = start; i <= stop; i++) {
    const accountName = `${orgPrefix}accounts${org}_account_${i}`;
    const accountId = await getAccountId(tier, accountName);

    if (accountId) {
      accounts.push({ accountName, accountId });
    } else {
      console.warn(`No accountId found for ${accountName}`);
    }
  }

  // Assume roles in parallel using Promise.allSettled
  try {
    const results = await Promise.allSettled(
      accounts.map(({ accountId, accountName }) =>
        getPolicyAndRole(org, accountName, accountId)
      )
    );

    const successful = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r) => {
        const error = r.reason;
        return {
          message: error?.message || "Unknown error",
          stack: error?.stack || "No stack available",
        };
      });

    return res.status(200).json({ success: successful, failed });


  } catch (error) {
    console.error("Error assuming roles:", error);
    return res.status(500).json({ error: "Error assuming roles" });
  }
}
