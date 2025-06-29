import { Pool } from 'pg'
import type { BitcoinPrice } from '~/server/types/bitcoin'

let pool: Pool

function getPool() {
    if (!pool) {
        const config = useRuntimeConfig()

        // Конфигурация подключения
        pool = new Pool({
            user: config.dbUser || 'postgres',
            host: config.dbHost || 'localhost',
            database: config.dbName || 'bitcoin_tracker',
            password: config.dbPassword || '89508699905',
            port: parseInt(config.dbPort || '5432'),
        })
    }

    return pool
}

// Инициализация базы данных
export async function initializeDatabase() {
    try {
        const database = getPool()
        await database.query(`
      CREATE TABLE IF NOT EXISTS bitcoin_prices (
        id SERIAL PRIMARY KEY,
        source VARCHAR(20) NOT NULL,
        timestamp BIGINT NOT NULL,
        price DECIMAL(18, 8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        coin_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`)

        await database.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS bitcoin_prices_timestamp_coin_id_source_idx
            ON bitcoin_prices (timestamp, coin_id, source)`)

        console.log('Database initialized successfully')
    } catch (error) {
        console.error('Database initialization failed:', error)
        throw error
    }
}

// Сохранение цены
export async function saveBitcoinPrice(data: BitcoinPrice) {
    try {
        const database = getPool()
        const result = await database.query(
            `INSERT INTO bitcoin_prices (timestamp, price, currency, coin_id, source)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (timestamp, coin_id, source) DO UPDATE
                 SET price = EXCLUDED.price`,
            [data.timestamp, data.price, data.currency, data.coinId, data.source]
        )
        return (result.rowCount ?? 0) > 0
    } catch (error) {
        console.error('Error saving bitcoin price:', error)
        throw error
    }
}

// Массовое сохранение цен
export async function saveBitcoinPricesBulk(data: BitcoinPrice[]) {
    if (data.length === 0) {
        return false
    }
    try {
        const database = getPool()
        // Преобразуем массив объектов в отдельные массивы для каждого столбца
        const timestamps = data.map(d => d.timestamp)
        const prices = data.map(d => d.price)
        const currencies = data.map(d => d.currency)
        const coinIds = data.map(d => d.coinId)
        const sources = data.map(d => d.source)

        // Используем UNNEST для передачи массивов в качестве строк для вставки
        const query = `
            INSERT INTO bitcoin_prices (timestamp, price, currency, coin_id, source)
            SELECT * FROM UNNEST(
                    $1::BIGINT[],
                    $2::DECIMAL[],
                    $3::VARCHAR[],
                    $4::VARCHAR[],
                    $5::VARCHAR[]
                          )
            ON CONFLICT (timestamp, coin_id, source) DO UPDATE
                SET price = EXCLUDED.price
        `;
        const result = await database.query(query, [timestamps, prices, currencies, coinIds, sources])

        return (result.rowCount ?? 0) > 0
    } catch (error) {
        console.error('Error bulk saving bitcoin prices:', error)
        throw error
    }
}

// Получение цен за период с адаптивной гранулярностью
export async function getBitcoinPrices(startTime: number, endTime: number, period: string, source: string) {
    try {
        const database = getPool()
        let queryText
        const queryParams = [startTime, endTime, source]

        // В зависимости от периода, применяем разную гранулярность данных
        switch (period) {
            case 'year':
            case 'month':
                // Для больших периодов - 1 точка в день
                queryText = `
                    SELECT DISTINCT ON (date_trunc('day', to_timestamp(timestamp / 1000)))
                           timestamp, price, currency, coin_id as "coinId"
                    FROM bitcoin_prices
                    WHERE timestamp BETWEEN $1 AND $2 AND source = $3
                    ORDER BY date_trunc('day', to_timestamp(timestamp / 1000))
                `
                break

            case 'week':
                // Для недели - 1 точка каждые 6 часов
                queryText = `
                    SELECT DISTINCT ON (floor(timestamp / (1000 * 60 * 60 * 6)))
                           timestamp, price, currency, coin_id as "coinId"
                    FROM bitcoin_prices
                    WHERE timestamp BETWEEN $1 AND $2 AND source = $3
                    ORDER BY floor(timestamp / (1000 * 60 * 60 * 6))
                `
                break

            case 'day':
            default:
                // Для дня - 1 точка в час
                queryText = `
                    SELECT DISTINCT ON (date_trunc('hour', to_timestamp(timestamp / 1000)))
                           timestamp, price, currency, coin_id as "coinId"
                    FROM bitcoin_prices
                    WHERE timestamp BETWEEN $1 AND $2 AND source = $3
                    ORDER BY date_trunc('hour', to_timestamp(timestamp / 1000))
                `
                break
        }

        const result = await database.query(queryText, queryParams)

        return result.rows
    } catch (error) {
        console.error('Error fetching bitcoin prices:', error)
        throw error
    }
}
