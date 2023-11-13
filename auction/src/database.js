const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

class Database{
    constructor(db_file){
        this.db_file = db_file;
        this.db = undefined;
    }
    async connect(){
        this.db = await sqlite.open({
			filename: this.db_file,
			driver: sqlite3.Database
		});
    }

    async migrate(){
        return this.db.exec(`
            DROP TABLE IF EXISTS userData;
            CREATE TABLE IF NOT EXISTS userData (
                id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                username   VARCHAR(255) NOT NULL UNIQUE,
                password   VARCHAR(255) NOT NULL,
                balance    INTEGER NOT NULL
            );
            DROP TABLE IF EXISTS sessions;
            
            CREATE TABLE IF NOT EXISTS sessions (
                id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                user_win   INTEGER NOT NULL,
                max_bid   INTEGER NOT NULL
            );
            
            DROP TABLE IF EXISTS bids;

            CREATE TABLE IF NOT EXISTS bids (
                id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL,
                session_id INTEGER NOT NULL,
                bid        INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES userData(id),
                FOREIGN KEY(session_id) REFERENCES sessions(id)
            );

            INSERT INTO sessions(user_win, max_bid) VALUES (-1, 294);
        `);
    }
    async createNewSession(){
        return this.db.run(`
            INSERT INTO sessions(user_win, max_bid) VALUES (-1, 294);
        `);
    }

    async getUser(username){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('SELECT * FROM userData WHERE username = ?');
                res((await stm.get(username)));
            }catch(e){
                rej(e);
            }
        })
    }

    async createUser(username, password){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('INSERT INTO userData(username, password, balance) VALUES (?, ?, 10)');
                res((await stm.run(username, password)));
            }catch(e){
                rej(e);
            }
        })
    }

    async getLastSession(){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('SELECT * FROM sessions ORDER BY id DESC LIMIT 1');
                res((await stm.get()));
            }catch(e){
                rej(e);
            }
        })
    }

    async createBid(user_id, session_id){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('INSERT INTO bids(user_id, session_id, bid) VALUES (?, ?, 0)');
                res((await stm.run(user_id, session_id)));
            }catch(e){
                rej(e);
            }
        })
    }

    async getBid(user_id, session_id){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('SELECT * FROM bids WHERE user_id = ? AND session_id = ?');
                res((await stm.get(user_id, session_id)));
            }catch(e){
                rej(e);
            }
        })
    }

    async addBid(user_id, session_id, add_bid){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('UPDATE bids SET bid = bid + ? WHERE user_id = ? AND session_id = ?');
                res((await stm.run(add_bid, user_id, session_id)));
            }catch(e){
                rej(e);
            }
        })
    }

    async setMaxBid(session_id, max_bid,user_id){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('UPDATE sessions SET max_bid = ?, user_win = ? WHERE id = ?');
                res((await stm.run(max_bid, user_id , session_id)));
            }catch(e){
                rej(e);
            }
        })
    }

    async getUserById(id){
        return new Promise(async (res, rej) => {
            try{
                let stm = await this.db.prepare('SELECT * FROM userData WHERE id = ?');
                res((await stm.get(id)));
            }catch(e){
                rej(e);
            }
        })
    }
}


module.exports = Database;