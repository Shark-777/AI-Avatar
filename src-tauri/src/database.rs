use anyhow::{anyhow, Result};
use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ─── Domain types ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: i64,
    pub role: String,
    pub content: String,
    pub avatar_state: String,
    pub created_at: String,
}

// ─── Database wrapper ────────────────────────────────────────────────────────

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Opens (or creates) the SQLite database at the platform-appropriate data
    /// directory and ensures all required tables exist.
    pub fn new() -> Result<Self> {
        let db_path = Self::db_path()?;

        // Make sure the parent directory exists.
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| anyhow!("Failed to create data directory: {}", e))?;
        }

        let conn = Connection::open(&db_path)
            .map_err(|e| anyhow!("Failed to open database at {:?}: {}", db_path, e))?;

        let db = Self { conn };
        db.create_tables()?;
        Ok(db)
    }

    /// Returns the path to the SQLite file.
    fn db_path() -> Result<PathBuf> {
        let base = dirs::data_dir()
            .ok_or_else(|| anyhow!("Could not determine platform data directory"))?;
        Ok(base.join("buddy-avatar").join("buddy.db"))
    }

    /// Creates all required tables if they don't already exist.
    fn create_tables(&self) -> Result<()> {
        self.conn
            .execute_batch(
                "
                CREATE TABLE IF NOT EXISTS messages (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    role        TEXT    NOT NULL,
                    content     TEXT    NOT NULL,
                    avatar_state TEXT  NOT NULL DEFAULT 'idle',
                    created_at  TEXT    NOT NULL
                );

                CREATE TABLE IF NOT EXISTS facts (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    key        TEXT    NOT NULL UNIQUE,
                    value      TEXT    NOT NULL,
                    updated_at TEXT    NOT NULL
                );
                ",
            )
            .map_err(|e| anyhow!("Failed to create tables: {}", e))
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /// Persists a new message and returns its auto-generated row id.
    pub fn save_message(&self, role: &str, content: &str, avatar_state: &str) -> Result<i64> {
        let now = Utc::now().to_rfc3339();
        self.conn
            .execute(
                "INSERT INTO messages (role, content, avatar_state, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![role, content, avatar_state, now],
            )
            .map_err(|e| anyhow!("Failed to save message: {}", e))?;

        Ok(self.conn.last_insert_rowid())
    }

    /// Returns up to `limit` messages, ordered newest-first.
    pub fn get_messages(&self, limit: i32) -> Result<Vec<Message>> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, role, content, avatar_state, created_at
                 FROM messages
                 ORDER BY id DESC
                 LIMIT ?1",
            )
            .map_err(|e| anyhow!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map(params![limit], |row| {
                Ok(Message {
                    id: row.get(0)?,
                    role: row.get(1)?,
                    content: row.get(2)?,
                    avatar_state: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| anyhow!("Failed to query messages: {}", e))?;

        let mut messages = Vec::new();
        for row in rows {
            messages.push(row.map_err(|e| anyhow!("Row error: {}", e))?);
        }
        Ok(messages)
    }

    // ── Facts ─────────────────────────────────────────────────────────────────

    /// Upserts a key-value fact.
    pub fn save_fact(&self, key: &str, value: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        self.conn
            .execute(
                "INSERT INTO facts (key, value, updated_at) VALUES (?1, ?2, ?3)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                params![key, value, now],
            )
            .map_err(|e| anyhow!("Failed to save fact: {}", e))?;
        Ok(())
    }

    /// Retrieves a fact by key. Returns `None` when the key does not exist.
    pub fn get_fact(&self, key: &str) -> Result<Option<String>> {
        match self
            .conn
            .query_row("SELECT value FROM facts WHERE key = ?1", params![key], |row| {
                row.get::<_, String>(0)
            }) {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(anyhow!("Failed to get fact: {}", e)),
        }
    }
}
