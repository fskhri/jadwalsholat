import { searchProvince } from '../../helper/Province'
import type { RegionData } from '../../helper/Interface'
import { getSession } from '../../helper/Session'
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { searchCity, searchPrayTime } from '../../helper/Network'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    var queryProvince = req.query['provinsi'] as string | undefined
    var queryCity = req.query['kota'] as string | undefined
    var queryMonth = req.query['bulan'] as string | undefined
    var queryYear = req.query['tahun'] as string | undefined

    if (
        queryProvince == undefined || 
        queryCity == undefined ||
        queryMonth == undefined ||
        queryYear == undefined
    ) {
        return res.status(400).json({message: "Please fill all required parameter"})
    }

    if (queryProvince.includes("+")) {
        queryProvince = queryProvince.replaceAll("+", " ")
    }

    if (queryCity.includes("+")) {
        queryCity = queryCity.replaceAll("+", " ")
    }

    let provinceData = searchProvince(queryProvince.toLowerCase())

    if (provinceData == undefined) {
        return res.status(400).json({ message: "Unknown `provinsi` data, try another key" })
    }

    let listCity = await searchCity(provinceData.id)
    let cityData = listCity.find(function (row) { return row.name == queryCity })

    if (cityData == undefined) {
        return res.status(400).json({ message: "Unknown `kota` data, try another key" })
    }

    const monthNum = parseInt(queryMonth)
    const yearNum = parseInt(queryYear)

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Invalid month. Must be between 1-12" })
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ message: "Invalid year" })
    }

    queryMonth = monthNum.toString().padStart(2, '0')

    console.log('Search params:', {
        provinceId: provinceData.id,
        cityId: cityData.id,
        month: queryMonth,
        year: queryYear
    })

    let listPrayTime = await searchPrayTime(provinceData.id, cityData.id, queryMonth, queryYear)

    return res.status(200).json({data: listPrayTime})
}