import React, { useState } from 'react';

export default function DeletePolicyButton({ accountName, org, tier, policyName, onDeleted }) {
  const [error, setError] = useState(null);

  async function handleDelete() {
    setError(null);

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this policy?\n${policyName}`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/policies/delete-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            org,          
            tier,         
            accountName,
            policyName,
          })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete policy');
      }

      alert('Policy deleted successfully!');
      if (onDeleted) onDeleted(policyName);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <button
        className="px-2 py-1 bg-red-600 text-white text-sm rounded"
        onClick={handleDelete}
      >
        Delete
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
