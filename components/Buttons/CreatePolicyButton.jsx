import React, { useState } from 'react';

export default function CreatePolicyButton({ accountName, org, tier }) {
  const [showForm, setShowForm] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyText, setPolicyText] = useState(
    JSON.stringify({ Version: '2012-10-17', Statement: [] }, null, 2)
  );
  const [error, setError] = useState(null);

  async function handleCreate() {
    setError(null);
    try {
      const policyDocument = JSON.parse(policyText);

      const response = await fetch('/api/policies/create-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            org,          
            tier,         
            accountName,
            policyName,
            policyDocument
          })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create policy');
      }

      alert('Policy created successfully!');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={() => setShowForm(true)}
      >
        Create Single Policy for Account
      </button>

      {showForm && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-bold mb-2">Create Policy</h3>

          <label className="block mb-2 text-sm font-medium">
            Policy Name:
            <input
              className="block w-full mt-1 p-1 border rounded"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Enter policy name"
            />
          </label>

          <label className="block mb-2 text-sm font-medium">
            Policy JSON:
            <textarea
              className="block w-full mt-1 p-1 border rounded text-xs font-mono"
              rows={10}
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
            />
          </label>

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleCreate}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
