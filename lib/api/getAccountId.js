import prisma from "@/lib/prisma"

export default async function getAccountId(tier, accountName) {
    console.log(`running getAccountId with accountName ${accountName} and tier ${tier}`)
    try {
      if (tier === 'free') {
        // For free users, use accountName to find the account
        const result = await prisma.free_Accounts.findFirst({
          where: {
            accountName: accountName
          },
          select: {
            accountId: true
          }
        });
        return result ? result.accountId : null;
      } else {
        // For pro/enterprise, use proOrEnterpriseAccountName
        const result = await prisma.pro_Or_Enterprise_Accounts.findFirst({
          where: {
            proOrEnterpriseAccountName: accountName
          },
          select: {
            accountId: true
          }
        });
        return result ? result.accountId : null;
      }
    } catch (error) {
      console.error('Error during getAccountId:', error);
      return null;
    }
  }