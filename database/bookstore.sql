-- Create database
CREATE DATABASE IF NOT EXISTS bookstore;
USE bookstore;

-- Books table
CREATE TABLE books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 0,
    genre VARCHAR(100),
    isbn VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO books (title, author, price, quantity, genre, isbn) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 12.99, 50, 'Classic', '9780743273565'),
('To Kill a Mockingbird', 'Harper Lee', 14.99, 30, 'Fiction', '9780061120084'),
('1984', 'George Orwell', 10.99, 40, 'Dystopian', '9780451524935'),
('The Hobbit', 'J.R.R. Tolkien', 16.99, 25, 'Fantasy', '9780547928227'),
('Pride and Prejudice', 'Jane Austen', 9.99, 60, 'Romance', '9780141439518');

-- Users table (for future authentication)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    total_amount DECIMAL(10, 2),
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    book_id INT,
    quantity INT,
    price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);