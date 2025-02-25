import React, { useEffect, useState } from 'react';
import { parseAccountName } from '@/lib/parseAccountName';

export default function FetchPoliciesButton({
    org,
    tier,
    capacityList,
    onFetch
}) {
    const [startAt, setStartAt] = useState(null);
    const [stopAt, setStopAt] = useState(null);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (capacityList?.length) {
            const numbers = capacityList.map((pool) => {
                const { account } = parseAccountName(pool.accountName || '');
                return account;
            });
            const valid = numbers.filter((n) => !isNaN(n) && n > 0);

            if (valid.length) {
                setStartAt(Math.min(...valid));
                setStopAt(Math.max(...valid));
            } else {
                setStartAt(1);
                setStopAt(capacityList.length);
            }
        }
    }, [capacityList]);

    async function handleFetchPolicies() {
        try {
            setError(null);
            setIsSuccess(false);
            const response = await fetch('/api/policies/get-policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startAt, stopAt, org, tier }),
            });
            if (!response.ok) throw new Error('Failed to fetch policies');

            const data = await response.json();

            // Transform the array to an object keyed by `accountName`
            const transformed = {};
            data.success.forEach((item) => {
                transformed[item.accountName] = item;
            });

            if (onFetch) onFetch(transformed);

            setIsSuccess(true);
        } catch (err) {
            setError(err.message);
            if (onFetch) onFetch({});
        }
    }

    return (
        <div>
            <button
                className="w-100 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={startAt == null || stopAt == null}
                onClick={handleFetchPolicies}
            >
                Fetch Policies for Org {org} (Accounts {startAt} - {stopAt})
            </button>

            {error && <p className="text-red-600 mt-2">{error}</p>}

            {isSuccess && (
                <p className="text-green-600 mt-2">
                    Policies fetched successfully!
                </p>
            )}
        </div>
    );
}