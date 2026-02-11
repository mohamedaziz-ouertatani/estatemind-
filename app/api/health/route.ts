import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Database Health Check Endpoint
 * Returns the health status of the database connection
 */
export async function GET() {
  try {
    // Try to query the database
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }, { status: 503 })
  }
}
