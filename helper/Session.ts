import axios from 'axios'
const setCookie = require('set-cookie-parser')

// Tambahkan fungsi delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Tambahkan fungsi retry helper
const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await operation();
            if (result) return result;
            
            console.log(`Attempt ${attempt}: Empty result, retrying...`);
            await delay(delayMs * attempt);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            console.log(`Attempt ${attempt} failed, retrying...`);
            await delay(delayMs * attempt);
        }
    }
    throw new Error(`Failed after ${maxAttempts} attempts`);
};

export const getSession = async () => {
    const getSessionAttempt = async () => {
        const response = await axios.get(
            'https://bimasislam.kemenag.go.id/jadwalshalat',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            }
        );

        const cookies = setCookie.parse(response, {
            decodeValues: true,
            map: true
        });

        if (!cookies['PHPSESSID']) return null;
        return cookies['PHPSESSID'].value;
    }

    return await retryOperation(getSessionAttempt, 3, 1000);
}