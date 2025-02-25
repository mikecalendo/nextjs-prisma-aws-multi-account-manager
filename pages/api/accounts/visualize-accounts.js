import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  try {
    // Fetch all users with the necessary fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        accountId: true,
        proOrEnterpriseAccountId: true,
        accountName: true,
        proOrEnterpriseAccountName: true,
        linkedAccountId: true,
      },
    })

    // Filter users by tier
    const freeUsers = users.filter(user => user.tier === 'free')
    // console.log('Free user:', freeUsers[0])
    const proEnterpriseUsers = users.filter(user => user.tier === 'pro' || user.tier === 'enterprise')
    // console.log('Pro/Enterprise users:', proEnterpriseUsers[0])

    // Format users for response
    const formatUsers = (users, isFreeTier) =>
      users.map(user => {
        if (isFreeTier) {
          return {
            id: user.id,
            name: user.name,
            tier: user.tier,
            accountId: user.accountId,
            accountName: user.accountName,
            linkedAccountId: user.linkedAccountId,
          }
        } else {
          return {
            id: user.id,
            name: user.name,
            tier: user.tier,
            proOrEnterpriseAccountId: user.proOrEnterpriseAccountId,
            proOrEnterpriseAccountName: user.proOrEnterpriseAccountName,
            linkedAccountId: user.linkedAccountId,
          }
        }
      })

    const formattedFreeUsers = formatUsers(freeUsers, true)
    const formattedProEnterpriseUsers = formatUsers(proEnterpriseUsers, false)

    // Fetch pool capacity data from both free and pro/enterprise pools
    const freePools = await prisma.free_Accounts.findMany()
    const proEnterprisePools = await prisma.pro_Or_Enterprise_Accounts.findMany()

    // Format and sort the pool data (full capacity pools first)
    const formatPools = (pools) =>
      pools
        .map(pool => ({
          poolId: pool.id,
          totalTenants: pool.totalTenants,
          accountNumber: pool.accountNumber,
          accountName: pool.accountName,
          isFullCapacity: pool.isFullCapacity,
          fullCapacity: pool.fullCapacity,
          assignedToUser: pool.assignedToUser,
          isAssigned: pool.isAssigned,
        }))
        .sort((a, b) => (b.isFullCapacity ? 1 : 0) - (a.isFullCapacity ? 1 : 0))

    const formattedFreePools = formatPools(freePools)
    const formattedProEnterprisePools = formatPools(proEnterprisePools)

    // console.log('Formatted Free Pools:', formattedFreePools[0])
    // console.log('Formatted Pro/Enterprise Pools:', formattedProEnterprisePools[0])

    // Prepare the final response object with group counts embedded in the keys
    const responseData = {
      [`ProAndEnterprise-${formattedProEnterpriseUsers.length}`]: formattedProEnterpriseUsers,
      [`Free-${formattedFreeUsers.length}`]: formattedFreeUsers,
      [`ProAndEnterpriseCapacity-${formattedProEnterprisePools.length}`]: formattedProEnterprisePools,
      [`FreeCapacity-${formattedFreePools.length}`]: formattedFreePools,
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error('Error fetching account data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
