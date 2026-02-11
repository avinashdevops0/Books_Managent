class BookstoreApp {
    constructor() {
        this.currentView = 'books';
        this.books = [];
        this.currentBookId = null;
        this.deleteBookId = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadBooks();
        this.loadStatistics();
        this.setupForm();
    }
    
    bindEvents() {
        // Sidebar navigation
        document.querySelectorAll('.btn-sidebar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => this.searchBooks());
        document.getElementById('searchInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.searchBooks();
        });
        // Dynamic search on input
        document.getElementById('searchInput').addEventListener('input', this.debounce(() => this.searchBooks(), 300));

        // Form handling
        document.getElementById('bookForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelForm());

        // Modal handling
        document.getElementById('confirmDelete').addEventListener('click', () => this.deleteBook());
        document.getElementById('cancelDelete').addEventListener('click', () => this.hideDeleteModal());
    }
    
    switchView(view) {
        // Update active button
        document.querySelectorAll('.btn-sidebar').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) btn.classList.add('active');
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');

        // Update form title if needed
        if (view === 'add') {
            if (this.currentBookId) {
                document.getElementById('formTitle').textContent = 'Edit Book';
            } else {
                document.getElementById('formTitle').textContent = 'Add New Book';
                this.resetForm();
            }
        }

        this.currentView = view;

        // Load statistics when switching to stats view
        if (view === 'stats') {
            this.loadStatistics();
        }
    }
    
    async loadBooks() {
        try {
            const response = await fetch('/api/books');
            this.books = await response.json();
            this.renderBooks();
            this.updateHeaderStats();
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Failed to load books', 'error');
        }
    }
    
    renderBooks() {
        const booksGrid = document.getElementById('booksGrid');
        booksGrid.innerHTML = '';
        
        if (this.books.length === 0) {
            booksGrid.innerHTML = '<p class="no-books">No books found. Add some books to get started!</p>';
            return;
        }
        
        this.books.forEach(book => {
            const bookCard = this.createBookCard(book);
            booksGrid.appendChild(bookCard);
        });
    }
    
    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="book-header">
                <div>
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                </div>
                <div class="book-price">$${book.price}</div>
            </div>
            <div class="book-details">
                <div class="book-detail">
                    <span>Genre:</span>
                    <span>${book.genre}</span>
                </div>
                <div class="book-detail">
                    <span>ISBN:</span>
                    <span>${book.isbn}</span>
                </div>
                <div class="book-detail">
                    <span>Quantity:</span>
                    <span class="${book.quantity === 0 ? 'text-danger' : ''}">
                        ${book.quantity} ${book.quantity === 0 ? '(Out of Stock)' : ''}
                    </span>
                </div>
                <div class="book-detail">
                    <span>Added:</span>
                    <span>${new Date(book.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="book-actions">
                <button class="btn btn-primary edit-btn" data-id="${book.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger delete-btn" data-id="${book.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        // Add event listeners to buttons
        card.querySelector('.edit-btn').addEventListener('click', () => this.editBook(book.id));
        card.querySelector('.delete-btn').addEventListener('click', () => this.showDeleteModal(book.id));
        
        return card;
    }
    
    async searchBooks() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            this.loadBooks();
            return;
        }
        
        try {
            const response = await fetch(`/api/books/search/${encodeURIComponent(query)}`);
            this.books = await response.json();
            this.renderBooks();
        } catch (error) {
            console.error('Error searching books:', error);
            this.showNotification('Failed to search books', 'error');
        }
    }
    
    setupForm() {
        // Form validation for add form
        const form = document.getElementById('bookForm');
        form.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                e.target.classList.remove('invalid');
            }
        });

        // Form validation for edit form
        const editForm = document.getElementById('editBookForm');
        editForm.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                e.target.classList.remove('invalid');
            }
        });

        // Bind edit form events
        document.getElementById('editBookForm').addEventListener('submit', (e) => this.handleEditSubmit(e));
        document.getElementById('cancelEdit').addEventListener('click', () => this.hideEditModal());
    }
    
    resetForm() {
        document.getElementById('bookForm').reset();
        document.getElementById('bookId').value = '';
        this.currentBookId = null;
    }

    resetEditForm() {
        document.getElementById('editBookForm').reset();
        document.getElementById('editBookId').value = '';
    }
    
    async editBook(id) {
        try {
            const response = await fetch(`/api/books/${id}`);
            const book = await response.json();

            // Fill edit modal form with book data
            document.getElementById('editBookId').value = book.id;
            document.getElementById('editTitle').value = book.title;
            document.getElementById('editAuthor').value = book.author;
            document.getElementById('editPrice').value = book.price;
            document.getElementById('editQuantity').value = book.quantity;
            document.getElementById('editGenre').value = book.genre;
            document.getElementById('editIsbn').value = book.isbn;

            // Show edit modal
            document.getElementById('editModal').classList.add('active');

        } catch (error) {
            console.error('Error loading book for edit:', error);
            this.showNotification('Failed to load book details', 'error');
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value.trim(),
            author: document.getElementById('author').value.trim(),
            price: parseFloat(document.getElementById('price').value),
            quantity: parseInt(document.getElementById('quantity').value),
            genre: document.getElementById('genre').value.trim(),
            isbn: document.getElementById('isbn').value.trim()
        };

        // Validation
        if (!formData.title || !formData.author || !formData.genre || !formData.isbn) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const bookId = document.getElementById('bookId').value;
        const method = bookId ? 'PUT' : 'POST';
        const url = bookId ? `/api/books/${bookId}` : '/api/books';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to save book');
            }

            const result = await response.json();
            this.showNotification(result.message || 'Book saved successfully', 'success');

            // Reset form and reload books
            this.resetForm();
            this.loadBooks();
            this.switchView('books');

        } catch (error) {
            console.error('Error saving book:', error);
            this.showNotification('Failed to save book', 'error');
        }
    }

    async handleEditSubmit(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('editTitle').value.trim(),
            author: document.getElementById('editAuthor').value.trim(),
            price: parseFloat(document.getElementById('editPrice').value),
            quantity: parseInt(document.getElementById('editQuantity').value),
            genre: document.getElementById('editGenre').value.trim(),
            isbn: document.getElementById('editIsbn').value.trim()
        };

        // Validation
        if (!formData.title || !formData.author || !formData.genre || !formData.isbn) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const bookId = document.getElementById('editBookId').value;
        const url = `/api/books/${bookId}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update book');
            }

            const result = await response.json();
            this.showNotification(result.message || 'Book updated successfully', 'success');

            // Hide modal and reload books
            this.hideEditModal();
            this.loadBooks();

        } catch (error) {
            console.error('Error updating book:', error);
            this.showNotification('Failed to update book', 'error');
        }
    }

    hideEditModal() {
        this.resetEditForm();
        document.getElementById('editModal').classList.remove('active');
    }
    
    cancelForm() {
        this.resetForm();
        this.switchView('books');
    }
    
    showDeleteModal(id) {
        this.deleteBookId = id;
        document.getElementById('deleteModal').classList.add('active');
    }
    
    hideDeleteModal() {
        this.deleteBookId = null;
        document.getElementById('deleteModal').classList.remove('active');
    }
    
    async deleteBook() {
        if (!this.deleteBookId) return;
        
        try {
            const response = await fetch(`/api/books/${this.deleteBookId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete book');
            }
            
            this.showNotification('Book deleted successfully', 'success');
            this.hideDeleteModal();
            this.loadBooks();
            
        } catch (error) {
            console.error('Error deleting book:', error);
            this.showNotification('Failed to delete book', 'error');
            this.hideDeleteModal();
        }
    }
    
    async loadStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const stats = await response.json();
            
            // Update statistic cards
            document.getElementById('statTotalBooks').textContent = stats.total_books || 0;
            document.getElementById('statTotalQuantity').textContent = stats.total_quantity || 0;
            document.getElementById('statAvgPrice').textContent = `$${(stats.avg_price || 0).toFixed(2)}`;
            document.getElementById('statTotalValue').textContent = `$${(stats.total_value || 0).toFixed(2)}`;
            
            // Update header stats
            this.updateHeaderStats();
            
            // Render genre chart
            this.renderGenreChart(stats.genres);
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
    
    updateHeaderStats() {
        const totalBooks = this.books.length;
        const totalValue = this.books.reduce((sum, book) => sum + (book.price * book.quantity), 0);
        
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    }
    
    renderGenreChart(genres) {
        const genreChart = document.getElementById('genreChart');
        genreChart.innerHTML = '';

        if (!genres || genres.length === 0) {
            genreChart.innerHTML = '<div class="no-data"><i class="fas fa-chart-pie"></i><p>No genre data available</p><small>Add some books to see genre distribution</small></div>';
            return;
        }

        // Sort genres by count (descending)
        const sortedGenres = genres.sort((a, b) => b.count - a.count);

        sortedGenres.forEach((genre, index) => {
            const genreItem = document.createElement('div');
            genreItem.className = 'genre-item';
            const percentage = ((genre.count / this.books.length) * 100).toFixed(1);

            genreItem.innerHTML = `
                <div class="genre-info">
                    <span class="genre-name">${genre.genre}</span>
                    <span class="genre-percentage">${percentage}%</span>
                </div>
                <span class="genre-count">${genre.count} books</span>
            `;

            // Add rank indicator for top genres
            if (index < 3) {
                const rankIcon = ['🥇', '🥈', '🥉'][index];
                genreItem.querySelector('.genre-name').insertAdjacentHTML('afterbegin', `${rankIcon} `);
            }

            genreChart.appendChild(genreItem);
        });
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        // Add close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        document.body.appendChild(notification);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookstoreApp();
});