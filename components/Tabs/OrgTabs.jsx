import { useEffect, useState } from 'react';
import { parseAccountNameFetch } from '@/lib/parseAccountName';
import FetchPoliciesButton from '@/components/Buttons/FetchPoliciesButton';
import BulkCreatePoliciesButton from '@/components/Buttons/BulkCreatePoliciesButton'
import MemberAccounts from '@/components/MemberAccounts';

export default function OrgTabs() {
  const [data, setData] = useState(null);
  const [orgGroups, setOrgGroups] = useState({});
  const [activeOrg, setActiveOrg] = useState(null);
  const [activeOrgTier, setActiveOrgTier] = useState('free');

  const [expandedPools, setExpandedPools] = useState({});
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  const [policyResults, setPolicyResults] = useState({});

  const [showPolicies, setShowPolicies] = useState(false);

  useEffect(() => {
    fetch('/api/accounts/visualize-accounts')
      .then((res) => res.json())
      .then((fetchedData) => {
        const mergedAccounts = [];
        const mergedCapacity = [];
        Object.keys(fetchedData).forEach((key) => {
          if (key.includes('Capacity')) {
            mergedCapacity.push(...fetchedData[key]);
          } else {
            mergedAccounts.push(...fetchedData[key]);
          }
        });
        setData({ mergedAccounts, mergedCapacity });
      })
      .catch((err) => console.error('Error:', err));
  }, []);

  useEffect(() => {
    if (data) {
      const groups = {};

      // Process mergedAccounts
      data.mergedAccounts.forEach((account) => {
        const poolName =
          account.tier === 'free' ? account.accountName : account.proOrEnterpriseAccountName;
        // Skip if poolName is empty or whitespace only
        if (!poolName || !poolName.trim()) return;

        const { org, isValid } = parseAccountNameFetch(poolName);
        // If isValid is true, group it by org
        if (isValid && org !== null) {
          const orgKey = org.toString();
          if (!groups[orgKey]) {
            groups[orgKey] = { accounts: [], capacity: [] };
          }
          groups[orgKey].accounts.push(account);
        }
      });

      // Process mergedCapacity
      data.mergedCapacity.forEach((pool) => {
        if (!pool.accountName || !pool.accountName.trim()) return;

        const { org, isValid } = parseAccountNameFetch(pool.accountName);
        if (isValid && org !== null) {
          const orgKey = org.toString();
          if (!groups[orgKey]) {
            groups[orgKey] = { accounts: [], capacity: [] };
          }
          groups[orgKey].capacity.push(pool);
        }
      });

      // Filter out any group that has no accounts and no capacity
      const filteredGroups = Object.fromEntries(
        Object.entries(groups).filter(([orgKey, group]) => {
          const hasAccounts = group.accounts.length > 0;
          const hasCapacity = group.capacity.length > 0;
          return hasAccounts || hasCapacity;
        })
      );

      // Store the final groups in state
      setOrgGroups(filteredGroups);

      // Set the active org if any valid groups remain
      const validKeys = Object.keys(filteredGroups);
      if (validKeys.length) {
        setActiveOrg(validKeys[0]);
        setActiveOrgTier(filteredGroups[validKeys[0]].accounts[0]?.tier || 'pro');
      }
    }
  }, [data]);

  const renderOrgTabs = () => {
    const orgKeys = Object.keys(orgGroups);
    if (!orgKeys.length) return null;

    return (
      <div className="border-b mb-4">
        <nav className="flex space-x-6">
          {orgKeys.map((orgKey) => (
            <button
              key={orgKey}
              onClick={() => {
                setActiveOrg(orgKey);
                const firstTier = orgGroups[orgKey].accounts[0]?.tier || 'pro';
                setActiveOrgTier(firstTier);
                setExpandedPools({});
                setSelectedAccountIds([]);
                setShowPolicies(false); // Reset policies on org change
              }}
              className={`pb-2 ${activeOrg === orgKey ? 'border-b-2 border-indigo-500' : ''}`}
            >
              Root Org {orgKey}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  // If there's no group for this activeOrg yet, return early or show a loading state
  if (!orgGroups[activeOrg]) {
    return <p>Loading account data...</p>;
  }

  // Now you can safely access .accounts
  // const selectedAccounts = orgGroups[activeOrg].accounts
  //   .filter((acct) => selectedAccountIds.includes(acct.id))
  //   .map((acct) => {
  //     const poolName = acct.tier === 'free' ? acct.accountName : acct.proOrEnterpriseAccountName;
  //     return { accountName: poolName };
  //   });

  if (!activeOrg) return <p>Loading organizations...</p>;

  return (
    <div>
      {renderOrgTabs()}

      <div className="flex flex-row justify-center space-x-4 mb-4">
        <FetchPoliciesButton
          org={activeOrg}
          tier={activeOrgTier}
          capacityList={orgGroups[activeOrg]?.capacity || []}
          onFetch={setPolicyResults}
        />

        <BulkCreatePoliciesButton
          org={activeOrg}
          tier={activeOrgTier}
          selectedAccounts={selectedAccountIds}
        />

      </div>

      <MemberAccounts
        capacityList={orgGroups[activeOrg].capacity}
        orgGroups={orgGroups}
        activeOrg={activeOrg}
        activeOrgTier={activeOrgTier}
        selectedAccountIds={selectedAccountIds}
        setSelectedAccountIds={setSelectedAccountIds}
        expandedPools={expandedPools}
        setExpandedPools={setExpandedPools}
        policyResults={policyResults}
      />
    </div>
  );
}
