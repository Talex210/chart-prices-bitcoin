import { Pool } from 'pg'
import type { BitcoinPrice } from '~/server/types/bitcoin'

// Конфигурация подключения
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bitcoin_tracker',
    password: process.env.DB_PASSWORD || '89508699905',
    port: parseInt(process.env.DB_PORT || '5432'),
})

// Инициализация базы данных
export async function initializeDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS bitcoin_prices (
        id SERIAL PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        price DECIMAL(18, 8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        coin_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_timestamp ON bitcoin_prices(timestamp);
      CREATE INDEX IF NOT EXISTS idx_coin_id ON bitcoin_prices(coin_id);
    `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

// Сохранение цены
export async function saveBitcoinPrice(data: BitcoinPrice) {
    try {
        const result = await pool.query(
            `INSERT INTO bitcoin_prices (timestamp, price, currency, coin_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (timestamp, coin_id) DO UPDATE
       SET price = EXCLUDED.price`,
            [data.timestamp, data.price, data.currency, data.coinId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error saving bitcoin price:', error);
        throw error;
    }
}

// Получение цен за период
export async function getBitcoinPrices(startTime: number, endTime: number) {
    try {
        const result = await pool.query(
            `SELECT timestamp, price, currency, coin_id as "coinId"
       FROM bitcoin_prices
       WHERE timestamp BETWEEN $1 AND $2
       ORDER BY timestamp ASC`,
            [startTime, endTime]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching bitcoin prices:', error);
        throw error;
    }
}

// попробовать убрать default, перенести экспорт наверх
export default pool;
