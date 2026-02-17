const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
module.exports = app;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bookstore',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// API Routes

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Get single book by ID
app.get('/api/books/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

// Search books
app.get('/api/books/search/:query', async (req, res) => {
    try {
        const query = `%${req.params.query}%`;
        const [rows] = await pool.query(
            'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR genre LIKE ? ORDER BY title ASC',
            [query, query, query]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error searching books:', error);
        res.status(500).json({ error: 'Failed to search books' });
    }
});

// Add new book
app.post('/api/books', async (req, res) => {
    try {
        const { title, author, price, quantity, genre, isbn } = req.body;

        // Parse numeric values to ensure correct types
        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity);

        console.log('Inserting book:', { title, author, parsedPrice, parsedQuantity, genre, isbn });

        const [result] = await pool.query(
            'INSERT INTO books (title, author, price, quantity, genre, isbn) VALUES (?, ?, ?, ?, ?, ?)',
            [title, author, parsedPrice, parsedQuantity, genre, isbn]
        );

        res.status(201).json({
            message: 'Book added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: error.message || 'Failed to add book' });
    }
});

// Update book
app.put('/api/books/:id', async (req, res) => {
    try {
        const { title, author, price, quantity, genre, isbn } = req.body;

        // Parse numeric values to ensure correct types
        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity);

        console.log('Updating book:', { id: req.params.id, title, author, parsedPrice, parsedQuantity, genre, isbn });

        const [result] = await pool.query(
            `UPDATE books
             SET title = ?, author = ?, price = ?, quantity = ?, genre = ?, isbn = ?
             WHERE id = ?`,
            [title, author, parsedPrice, parsedQuantity, genre, isbn, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: 'Book updated successfully' });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: error.message || 'Failed to update book' });
    }
});

// Delete book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_books,
                SUM(quantity) as total_quantity,
                AVG(price) as avg_price,
                SUM(price * quantity) as total_value
            FROM books
        `);
        
        const [genreStats] = await pool.query(`
            SELECT genre, COUNT(*) as count 
            FROM books 
            GROUP BY genre
        `);
        
        res.json({
            ...stats[0],
            genres: genreStats
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Serve HTML for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});