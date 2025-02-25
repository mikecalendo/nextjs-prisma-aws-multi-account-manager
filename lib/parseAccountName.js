export function parseAccountName(name) {
    const match = name.match(/_account_(\d+)/i);
    if (match) {
        return { account: parseInt(match[1], 10) };
    }
    return { account: null };
}

export function parseAccountNameFetch(accountName) {
    // Match 'accounts' followed by one or more digits and an underscore
    const match = accountName?.match(/accounts(\d+)_/);
    if (!match) {
        console.log('No match for:', accountName);
        return { org: null, isValid: false };
    }
    const org = parseInt(match[1], 10);
    return { org, isValid: true };
}

