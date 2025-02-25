import React from 'react';
import { parseAccountName } from '@/lib/parseAccountName';
import PolicyCard from '@/components/Cards/PolicyCard';
import CreatePolicyButton from '@/components/Buttons/CreatePolicyButton';

export default function MemberAccounts({
  capacityList,
  orgGroups,
  activeOrg,
  activeOrgTier,
  selectedAccountIds,
  setSelectedAccountIds,
  expandedPools,
  setExpandedPools,
  policyResults,
}) {
  if (!capacityList || !capacityList.length) {
    return <p>No capacity data available.</p>;
  }

  const sortedCapacity = [...capacityList].sort((a, b) => {
    const aNum = parseAccountName(a.accountName || '').account;
    const bNum = parseAccountName(b.accountName || '').account;
    return aNum - bNum;
  });

  const allAccountNames = sortedCapacity.map(pool => pool.accountName);
  const allSelected = allAccountNames.every(name => selectedAccountIds.includes(name));

  const handleSelectAllToggle = () => {
    if (allSelected) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(allAccountNames);
    }
  };

  const handlePolicyUpdate = async (policyArn, updatedPolicy) => {
    try {
      console.log('handlePolicyUpdate received:', policyArn, updatedPolicy);
      const response = await fetch('/api/policies/edit-policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org: activeOrg,
          tier: activeOrgTier,
          accountName: updatedPolicy.accountName, // Make sure this is passed correctly
          policyArn,
          policyDocument: updatedPolicy
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to edit policy');
      }

      alert('Policy updated successfully!');
    } catch (err) {
      console.error('Error updating policy:', err.message);
      alert('Error updating policy: ' + err.message);
    }
  };


  return (
    <div>
      <h1 className="text-2xl text-gray-500">{activeOrgTier.charAt(0).toUpperCase() + activeOrgTier.slice(1)} Account Pool {activeOrg}</h1>
      <label className="mt-4 inline-flex items-center mb-4 cursor-pointer">
        <input
          type="checkbox"
          className="form-checkbox h-5 w-5 text-indigo-600"
          checked={allSelected}
          onChange={handleSelectAllToggle}
        />
        <span className="ml-4 text-gray-700 text-lg mt-1">
          {allSelected ? 'Deselect All Accounts' : 'Select All Accounts'}
        </span>
      </label>
      <ul>
        {sortedCapacity.map(pool => {
          const poolId = pool.poolId;
          const isPoolExpanded = expandedPools[poolId] || false;
          const associatedAccounts = orgGroups[activeOrg].accounts.filter(acct => {
            const poolName = acct.tier === 'free' ? acct.accountName : acct.proOrEnterpriseAccountName;
            return poolName === pool.accountName;
          });
          const isSelected = selectedAccountIds.includes(pool.accountName);

          return (
            <li key={poolId} className="mb-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAccountIds(prev => [...prev, pool.accountName]);
                      } else {
                        setSelectedAccountIds(prev =>
                          prev.filter(name => name !== pool.accountName)
                        );
                      }
                    }}
                  />
                  <span className="ml-2 font-semibold">{pool.accountName}</span>
                  <p className="text-sm text-gray-500 ml-6">
                    Pool ID: {pool.poolId} | Tenants: {pool.totalTenants} / {pool.fullCapacity} |{' '}
                    {pool.isFullCapacity ? 'Full Capacity' : 'Available Capacity'}
                  </p>
                </div>
                <button
                  className="text-blue-600 text-sm underline"
                  onClick={() =>
                    setExpandedPools(prev => ({ ...prev, [poolId]: !isPoolExpanded }))
                  }
                >
                  {isPoolExpanded ? 'Hide Info' : 'Show Info'}
                </button>
              </div>
              {isPoolExpanded && (
                <div className="ml-4 mt-2">
                  {associatedAccounts.length ? (
                    <>
                      <p className="text-sm font-medium">
                        {associatedAccounts.length === 1 ? 'User in this account:' : 'Users in this account:'}
                      </p>
                      <ul className="list-disc pl-4 mb-4">
                        {associatedAccounts.map((account) => (
                          <li key={account.id} className="text-sm">
                            {account.name} (User ID: {account.id})
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No users in this account.</p>
                  )}
                  {policyResults?.[pool.accountName] ? (
                    <>
                      <div className="my-4">
                        <CreatePolicyButton
                          accountName={pool.accountName}
                          org={activeOrg}
                          tier={activeOrgTier}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {policyResults[pool.accountName].attachedPolicies.map(policy => (
                          <PolicyCard
                            policyName={policy.policyName}
                            policyArn={policy.policyArn}
                            policyDocument={policy.policyDocument}
                            accountName={pool.accountName}
                            org={activeOrg}
                            tier={activeOrgTier}
                            onSubmitPolicy={handlePolicyUpdate}
                          />

                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No fetched policy data for this account yet.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
