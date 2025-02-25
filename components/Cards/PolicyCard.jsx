import React, { useState, useEffect } from 'react';
import DeletePolicyButton from '@/components/Buttons/DeletePolicyButton';

// Function to check JSON validity and return the parsed object or error
const validateJson = (jsonStr) => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Object.keys(parsed).length === 0) {
      throw new Error("JSON is empty or invalid");
    }
    return { valid: true, parsed };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

export default function PolicyCard({
  policyName,
  policyArn,
  policyDocument,
  accountName,
  org,
  tier,
  onSubmitPolicy
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState(
    JSON.stringify(policyDocument, null, 2)
  );
  const [isValidJson, setIsValidJson] = useState(true);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    const { valid, error } = validateJson(editedPolicy);
    setIsValidJson(valid);
    setJsonError(error || '');
  }, [editedPolicy]);

  const toggleExpand = () => {
    if (isExpanded) {
      setIsEditing(false);
      setEditedPolicy(JSON.stringify(policyDocument, null, 2));
    }
    setIsExpanded(!isExpanded);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedPolicy(JSON.stringify(policyDocument, null, 2));
    setIsEditing(false);
  };

  const handleSubmit = () => {
    try {
      const updatedPolicyObject = JSON.parse(editedPolicy);
      if (onSubmitPolicy) {
        onSubmitPolicy(policyArn, { ...updatedPolicyObject, accountName });
      } else {
        console.log('Updated policy data:', updatedPolicyObject);
        alert('Policy submitted (console.log)!');
      }
      setIsEditing(false);
    } catch (err) {
      alert('Invalid JSON format!');
      console.error(err);
    }
  };

  return (
    <div
      className={`
      border rounded-lg shadow-sm p-4 transition-all duration-300 
      ${isExpanded ? 'w-full bg-blue-50' : 'w-70 h-50 bg-white'} 
      ${isEditing ? 'border-2 border-yellow-500' : ''}
    `}
      style={{ minWidth: '300px', maxWidth: '320px' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-md font-semibold break-words">{policyName}</h5>
        <div className="flex items-center space-x-4">
          <button onClick={toggleExpand} className="text-blue-500 text-sm focus:outline-none">
            {isExpanded ? 'Minimize' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2">
          {isEditing ? (
            <div className="flex flex-col gap-4">
              <div>
                <h6 className="font-bold mb-2 text-sm">Editing</h6>
                <textarea
                  className={`w-full h-64 text-xs border rounded p-2 font-mono ${isValidJson ? '' : 'border-red-500'
                    }`}
                  value={editedPolicy}
                  onChange={(e) => setEditedPolicy(e.target.value)}
                />
                {!isValidJson && (
                  <p className="text-red-600 text-xs mt-1">
                    Invalid JSON: {jsonError}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <button className="px-4 py-2 bg-gray-300 rounded text-sm" onClick={cancelEditing}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                  onClick={handleSubmit}
                  disabled={!isValidJson}
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-72">
              {JSON.stringify(policyDocument, null, 2)}
            </pre>
          )}

          <div className="mt-4 flex space-x-2">
            {!isEditing && (
              <button
                onClick={startEditing}
                className="ml-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
              >
                Edit
              </button>
            )}
            <DeletePolicyButton
              accountName={accountName}
              org={org}
              tier={tier}
              policyName={policyName}
              onDeleted={() => {
                alert('Policy deleted!');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
