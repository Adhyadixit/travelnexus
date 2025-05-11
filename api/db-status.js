export default async function handler(req, res) {
  try {
    // Parse the database URL to get connection details (without exposing credentials)
    let dbInfo = { host: 'unknown', database: 'unknown', user: 'unknown' };
    
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        dbInfo = {
          host: url.hostname || 'unknown',
          database: url.pathname.replace('/', '') || 'unknown',
          user: url.username || 'unknown'
        };
      } catch (e) {
        console.error('Error parsing DATABASE_URL:', e);
      }
    }
    
    // Return database connection info without attempting to connect
    return res.status(200).json({
      success: true,
      message: 'Database information retrieved',
      database_info: {
        host: dbInfo.host,
        database: dbInfo.database,
        has_credentials: process.env.DATABASE_URL ? 'true' : 'false'
      },
      environment: {
        node_env: process.env.NODE_ENV || 'not set',
        vercel: process.env.VERCEL === '1' ? 'true' : 'false',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    });
  } catch (error) {
    console.error('Error retrieving database info:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving database information',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
