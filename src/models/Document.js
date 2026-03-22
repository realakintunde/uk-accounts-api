const db = require('../database/config');

// In-memory storage for demo mode
const inMemoryDocuments = new Map();
let nextDocumentId = 1;

class Document {
  static async findAll(companyId, limit = 10, offset = 0) {
    if (!db.isConnected()) {
      const documents = Array.from(inMemoryDocuments.values())
        .filter(d => d.company_id === companyId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit);
      return documents;
    }
    const query = `
      SELECT * FROM documents 
      WHERE company_id = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [companyId, limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    if (!db.isConnected()) {
      const document = inMemoryDocuments.get(id);
      return document ? { ...document } : null;
    }
    const query = 'SELECT * FROM documents WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      company_id,
      document_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by,
    } = data;

    if (!db.isConnected()) {
      const id = nextDocumentId++;
      const newDocument = {
        id,
        company_id,
        document_type,
        file_name,
        file_path,
        file_size,
        mime_type,
        uploaded_by,
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryDocuments.set(id, newDocument);
      return newDocument;
    }

    const query = `
      INSERT INTO documents (
        company_id, document_type, file_name, file_path,
        file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(query, [
      company_id,
      document_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by,
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    if (!db.isConnected()) {
      inMemoryDocuments.delete(id);
      return;
    }
    const query = 'DELETE FROM documents WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = Document;
