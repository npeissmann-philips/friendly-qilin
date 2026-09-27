import { Pool } from 'pg';

export interface FileSummary {
  filename: string;
  totalChunks: number;
  providers: string[];
}

export interface DatabaseStats {
  totalDistinctFiles: number;
  totalChunks: number;
  files: FileSummary[];
}

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'embeddings_db',
    });
  }

  async initDatabase(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          text TEXT NOT NULL,
          provider TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          embedding vector
        );
      `);

      // Add metadata column if the table existed before but didn't have it
      try {
        await client.query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`);
      } catch (e) {
        // Ignore if column already exists or fails for some reason related to that
      }

      console.log('Database initialized successfully.');
    } catch (error) {
      console.error('Error initializing database:', error);
    } finally {
      client.release();
    }
  }

  async insertChunk(filename: string, chunkIndex: number, text: string, provider: string, embedding: number[], metadata: any = {}): Promise<void> {
    const query = `
      INSERT INTO document_chunks (filename, chunk_index, text, provider, metadata, embedding)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const vectorString = `[${embedding.join(',')}]`;
    await this.pool.query(query, [filename, chunkIndex, text, provider, metadata, vectorString]);
  }

  async searchSimilar(embedding: number[], provider: string, limit: number = 5, metadataFilter: any = null): Promise<any[]> {
    const vectorString = `[${embedding.join(',')}]`;
    
    let query = `
      SELECT id, filename, chunk_index, text, provider, metadata, 1 - (embedding <=> $1) as similarity
      FROM document_chunks
      WHERE provider = $2
    `;
    
    const params: any[] = [vectorString, provider];
    
    if (metadataFilter && Object.keys(metadataFilter).length > 0) {
      query += ` AND metadata @> $3`;
      params.push(metadataFilter);
    }
    
    query += `
      ORDER BY embedding <=> $1
      LIMIT $${params.length + 1};
    `;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getStoredFilesSummary(): Promise<DatabaseStats> {
    const query = `
      SELECT 
        filename, 
        COUNT(*)::int as total_chunks,
        array_agg(DISTINCT provider) as providers
      FROM document_chunks
      GROUP BY filename
      ORDER BY filename ASC;
    `;
    const result = await this.pool.query(query);
    const files: FileSummary[] = result.rows.map((r: any) => ({
      filename: r.filename,
      totalChunks: Number(r.total_chunks),
      providers: r.providers || [],
    }));
    const totalChunks = files.reduce((sum, f) => sum + f.totalChunks, 0);

    return {
      totalDistinctFiles: files.length,
      totalChunks,
      files,
    };
  }
}

