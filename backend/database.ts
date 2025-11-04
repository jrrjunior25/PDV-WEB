// backend/database.ts
import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';

const DB_FILE = 'pdv.sqlite';
const db = new sqlite3.Database(DB_FILE);

// Função para inicializar o banco de dados
export const initDatabase = async () => {
  try {
    const schema = await fs.readFile(path.resolve(__dirname, '../database.sql'), 'utf-8');
    db.exec(schema, (err) => {
      if (err) {
        console.error("Erro ao executar o schema SQL:", err.message);
      } else {
        console.log("Banco de dados inicializado com sucesso.");
      }
    });
  } catch (error) {
    console.error("Erro ao ler o arquivo de schema:", error);
  }
};

export default db;
