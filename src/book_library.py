"""
Book Library Management System
Handles persistent storage of books, progress tracking, and metadata
"""
import json
import os
import hashlib
from datetime import datetime
from typing import Dict, List, Optional


class BookLibrary:
    """Manages a collection of books with progress tracking"""
    
    def __init__(self, cache_dir='cache'):
        self.cache_dir = cache_dir
        self.library_file = os.path.join(cache_dir, 'books.json')
        self.books_folder = 'books'
        os.makedirs(cache_dir, exist_ok=True)
        os.makedirs(self.books_folder, exist_ok=True)
        self.library = self._load_library()
    
    def _load_library(self) -> Dict:
        """Load library from JSON file"""
        if os.path.exists(self.library_file):
            try:
                with open(self.library_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def _save_library(self):
        """Save library to JSON file"""
        try:
            with open(self.library_file, 'w', encoding='utf-8') as f:
                json.dump(self.library, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Error saving library: {e}")
    
    def _generate_book_id(self, filename: str) -> str:
        """Generate unique book ID from filename"""
        return hashlib.md5(filename.encode('utf-8')).hexdigest()[:12]
    
    def add_book(self, filename: str, filepath: str, total_pages: int) -> str:
        """
        Add a book to the library
        
        Args:
            filename: Original filename
            filepath: Path to the book file
            total_pages: Total number of pages
            
        Returns:
            Book ID
        """
        book_id = self._generate_book_id(filename)
        
        # Get file size
        file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
        
        # Create book entry
        book_entry = {
            'id': book_id,
            'filename': filename,
            'filepath': filepath,
            'total_pages': total_pages,
            'current_page': 0,
            'progress_percent': 0.0,
            'file_size': file_size,
            'date_added': datetime.now().isoformat(),
            'last_read': None,
            'completed': False
        }
        
        self.library[book_id] = book_entry
        self._save_library()
        
        print(f"Added book to library: {filename} (ID: {book_id})")
        return book_id
    
    def get_book(self, book_id: str) -> Optional[Dict]:
        """Get book details by ID"""
        return self.library.get(book_id)
    
    def get_all_books(self) -> List[Dict]:
        """Get all books in library, sorted by last read date"""
        books = list(self.library.values())
        # Sort by last_read (most recent first), then by date_added
        books.sort(key=lambda x: (
            x.get('last_read') or '1970-01-01',
            x.get('date_added', '1970-01-01')
        ), reverse=True)
        return books
    
    def update_progress(self, book_id: str, current_page: int) -> bool:
        """
        Update reading progress for a book
        
        Args:
            book_id: Book identifier
            current_page: Current page number (0-indexed)
            
        Returns:
            True if updated successfully
        """
        if book_id not in self.library:
            return False
        
        book = self.library[book_id]
        book['current_page'] = current_page
        book['last_read'] = datetime.now().isoformat()
        
        # Calculate progress percentage
        if book['total_pages'] > 0:
            book['progress_percent'] = (current_page / book['total_pages']) * 100
            book['completed'] = current_page >= book['total_pages'] - 1
        
        self._save_library()
        return True
    
    def delete_book(self, book_id: str) -> bool:
        """
        Delete a book from library and its files
        
        Args:
            book_id: Book identifier
            
        Returns:
            True if deleted successfully
        """
        if book_id not in self.library:
            return False
        
        book = self.library[book_id]
        
        # Remove book file if it exists
        filepath = book.get('filepath')
        if filepath and os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"Deleted book file: {filepath}")
            except OSError as e:
                print(f"Error deleting book file: {e}")
        
        # Remove from library
        del self.library[book_id]
        self._save_library()
        
        print(f"Removed book from library: {book.get('filename')} (ID: {book_id})")
        return True
    
    def get_library_stats(self) -> Dict:
        """Get library statistics"""
        books = list(self.library.values())
        total_books = len(books)
        completed_books = sum(1 for book in books if book.get('completed', False))
        in_progress = sum(1 for book in books if book.get('current_page', 0) > 0 and not book.get('completed', False))
        
        return {
            'total_books': total_books,
            'completed_books': completed_books,
            'in_progress': in_progress,
            'unread': total_books - completed_books - in_progress
        }