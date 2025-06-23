import { initializeDatabase } from '~/server/database/dataBase'

export default defineNitroPlugin(async () => {
    try {
        await initializeDatabase();
        console.log('Database connection established')
    } catch (error) {
        console.error('Failed to initialize database:', error)
    }
})
