import axios from 'axios';

interface Proxy {
    ip: string;
    port: number;
    protocol: string;
}

let proxyList: Proxy[] = [];
let currentProxyIndex = 0;

export async function refreshProxyList() {
    try {
        const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all');
        const proxies = response.data.split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => {
                const [ip, port] = line.split(':');
                return {
                    ip: ip.trim(),
                    port: parseInt(port.trim()),
                    protocol: 'http'
                };
            });
        proxyList = proxies;
        console.log(`Loaded ${proxies.length} proxies`);
    } catch (error) {
        console.error('Failed to fetch proxy list:', error);
        // Fallback to some default free proxies
        proxyList = [
            { ip: '103.149.130.38', port: 80, protocol: 'http' },
            { ip: '103.152.112.234', port: 80, protocol: 'http' },
            { ip: '103.152.112.162', port: 80, protocol: 'http' },
        ];
    }
}

export function getNextProxy(): Proxy | null {
    if (proxyList.length === 0) {
        return null;
    }
    const proxy = proxyList[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
    return proxy;
}

export function getProxyUrl(proxy: Proxy): string {
    return `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
}
