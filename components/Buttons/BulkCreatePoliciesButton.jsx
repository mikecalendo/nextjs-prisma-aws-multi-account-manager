import React, { useState } from 'react';

export default function BulkCreatePoliciesButton({ org, tier, selectedAccounts }) {
  const [showForm, setShowForm] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyText, setPolicyText] = useState(
    JSON.stringify(
      {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['iam:CreatePolicy', 'iam:DeletePolicy'],
            Resource: ['arn:aws:iam::<ACCOUNT_ID>:policy/*']
          }
        ]
      },
      null,
      2
    )
  );
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSubmit() {
    setError(null);
    setMessage(null);

    let policyDoc;
    try {
      policyDoc = JSON.parse(policyText);
    } catch (err) {
      setError('Invalid JSON format');
      return;
    }

    // If selectedAccounts is an array of strings, convert them to objects
    const preparedSelectedAccounts =
      Array.isArray(selectedAccounts) && typeof selectedAccounts[0] === 'string'
        ? selectedAccounts.map((accountName) => ({ accountName }))
        : selectedAccounts;

    const payload = { org, tier, selectedAccounts: preparedSelectedAccounts, policyName, policyDoc };

    console.log('payload ', payload)
    try {
      const response = await fetch('/api/policies/bulk-create-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create policies');
      }

      const result = await response.json();
      setMessage(`Successfully created policy for ${result.createdCount} accounts!`);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <button
        className="w-100 px-4 py-2 bg-green-600 text-white rounded"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel Bulk Create with Selected Accounts' : 'Bulk Create Policies with Selected Accounts'}
      </button>

      {showForm && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-bold mb-2">Bulk Create Policy</h3>

          <label className="block mb-2">
            Policy Name:
            <input
              className="block w-full mt-1 p-1 border rounded"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Enter policy name"
            />
          </label>

          <label className="block mb-2">
            Policy JSON:
            <textarea
              className="block w-full mt-1 p-1 border rounded text-xs font-mono"
              rows={10}
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
            />
          </label>

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit}>
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
