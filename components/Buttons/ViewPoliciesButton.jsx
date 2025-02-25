import React from 'react';

export default function ViewPoliciesButton({ showPolicies, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      {showPolicies ? 'Hide Policies' : 'View Policies'}
    </button>
  );
}