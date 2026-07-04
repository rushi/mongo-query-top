export const isInternalIp = (ip: string): boolean => {
    const parts = ip.split(".");
    if (parts.length !== 4) {
        return false;
    }

    const firstOctet = parseInt(parts[0], 10);
    const secondOctet = parseInt(parts[1], 10);

    if (firstOctet === 10) {
        return true;
    }

    if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
        return true;
    }

    if (firstOctet === 192 && secondOctet === 168) {
        return true;
    }

    if (firstOctet === 127) {
        return true;
    }

    return false;
};
