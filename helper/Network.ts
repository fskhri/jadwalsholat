import axios from 'axios'
import { getSession } from './Session'
import type { PrayTime, RegionData } from './Interface'

const searchCity = async (provinceId: string): Promise<RegionData[]> => {
    try {
        const phpSessionID = await getSession()
        
        // Gunakan URLSearchParams untuk format data
        const formData = new URLSearchParams()
        formData.append('x', provinceId)

        const response = await axios.post(
            'https://bimasislam.kemenag.go.id/ajax/getKabkoshalat',
            formData.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': 'PHPSESSID=' + phpSessionID,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        )

        var result: RegionData[] = []
        const regex = /(<option value="(.*?)">(.*?)<\/option>)/gm;
        let tempLooping;

        while ((tempLooping = regex.exec(response.data)) !== null) {
            if (tempLooping.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            var temp: RegionData = { id: '', name: '' }
            tempLooping.forEach((match, groupIndex) => {
                if (groupIndex == 2) temp.id = match
                else if (groupIndex == 3) temp.name = match.toLowerCase()
            });

            result.push(temp)
        }

        return result
    } catch (error) {
        console.error('Error fetching cities:', error)
        throw error
    }
}

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

const searchPrayTime = async (
    provinceId: string,
    cityId: string,
    month: string,
    year: string
): Promise<PrayTime[]> => {
    const makeRequest = async () => {
        const phpSessionID = await getSession()
        
        const formData = new URLSearchParams({
            'x': provinceId,
            'y': cityId,
            'bln': month,
            'thn': year,
            '_': Date.now().toString()
        })

        console.log(`Attempting request with session: ${phpSessionID}`)

        const response = await axios.post(
            'https://bimasislam.kemenag.go.id/ajax/getShalatbln',
            formData.toString(),
            {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Cookie': 'PHPSESSID=' + phpSessionID,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://bimasislam.kemenag.go.id',
                    'Referer': 'https://bimasislam.kemenag.go.id/jadwalshalat',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin'
                },
                withCredentials: true,
                maxRedirects: 5
            }
        )

        let responseData = response.data
        if (typeof responseData === 'string') {
            if (responseData.trim() === '') return null;
            try {
                responseData = JSON.parse(responseData)
            } catch (e) {
                console.error('Failed to parse response:', e)
                return null
            }
        }

        if (!responseData || !responseData.data) {
            return null
        }

        var result: PrayTime[] = []
        const keys = Object.keys(responseData.data)
        keys.forEach((key) => {
            let time: PrayTime = { key: key, ...responseData.data[key] }
            result.push(time)
        })

        return result.length > 0 ? result : null
    }

    try {
        // Coba request dengan retry mechanism
        const result = await retryOperation(makeRequest, 5, 2000) // 5 attempts, 2 second initial delay
        return result || []
    } catch (error) {
        console.error('All retry attempts failed:', error)
        return []
    }
}

export { searchCity, searchPrayTime }  