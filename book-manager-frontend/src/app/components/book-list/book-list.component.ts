import { ChangeDetectorRef, Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
})
export class BookListComponent implements OnInit {
  // List state
  books = signal<Book[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  toasts = signal<ToastMessage[]>([]);
  private toastIdCounter = 0;

  // Delete confirm 
  showDeleteConfirm = false;
  pendingDeleteId: number | null = null;
  pendingDeleteTitle = '';

  // Form dialog 
  showFormDialog = false;
  isEditMode = false;
  formBookId: number | null = null;
  submitting = false;
  formError = '';
  showUpdateConfirm = false;
  formBook: Omit<Book, 'id'> = {
    title: '',
    author: '',
    isbn: '',
    publicationDate: '',
  };

  @ViewChild('bookForm') bookForm!: NgForm;

  constructor(
    private bookService: BookService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  //Toast helpers
  showToast(message: string, type: ToastType = 'success'): void {
    const id = ++this.toastIdCounter;
    this.toasts.update((current) => [...current, { id, message, type }]);
    setTimeout(() => this.removeToast(id), 3000);
  }

  removeToast(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  // Book list 
  loadBooks(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.bookService
      .getBooks()
      .pipe(
        timeout(10000),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.books.set(data);
        },
        error: () => {
          this.errorMessage.set('Failed to load books. Make sure the backend is running.');
        },
      });
  }

  // Form dialog open/close 
  openAddDialog(): void {
    this.isEditMode = false;
    this.formBookId = null;
    this.formBook = { title: '', author: '', isbn: '', publicationDate: '' };
    this.formError = '';
    this.submitting = false;
    this.showUpdateConfirm = false;
    this.showFormDialog = true;
    this.cdr.detectChanges();
  }

  openEditDialog(id: number): void {
    this.isEditMode = true;
    this.formBookId = id;
    this.formBook = { title: '', author: '', isbn: '', publicationDate: '' };
    this.formError = '';
    this.submitting = false;
    this.showUpdateConfirm = false;
    this.showFormDialog = true;
    this.cdr.detectChanges();

    this.bookService.getBook(id).subscribe({
      next: (data) => {
        const dateStr = data.publicationDate
          ? new Date(data.publicationDate).toISOString().split('T')[0]
          : '';
        this.formBook = {
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          publicationDate: dateStr,
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.formError = 'Failed to load book details.';
        this.cdr.detectChanges();
      },
    });
  }

  closeFormDialog(): void {
    this.showFormDialog = false;
    this.showUpdateConfirm = false;
  }

  // Form submit 
  onSubmit(): void {
    this.formError = '';

    if (this.isEditMode) {
      this.showUpdateConfirm = true;
      return;
    }

    this.submitting = true;
    this.bookService.createBook(this.formBook).subscribe({
      next: () => {
        this.closeFormDialog();
        this.showToast(`"${this.formBook.title}" added successfully.`, 'success');
        this.loadBooks();
      },
      error: () => {
        this.formError = 'Failed to create book. Please try again.';
        this.submitting = false;
      },
    });
  }

  closeUpdateConfirm(): void {
    this.showUpdateConfirm = false;
  }

  confirmUpdate(): void {
    this.closeUpdateConfirm();
    if (this.formBookId === null) return;
    this.submitting = true;
    const updatedBook: Book = { id: this.formBookId, ...this.formBook };
    this.bookService.updateBook(this.formBookId, updatedBook).subscribe({
      next: () => {
        const title = this.formBook.title;
        this.closeFormDialog();
        this.showToast(`"${title}" updated successfully.`, 'success');
        this.loadBooks();
      },
      error: () => {
        this.formError = 'Failed to update book. Please try again.';
        this.submitting = false;
      },
    });
  }

  // Delete
  deleteBook(id: number, title: string): void {
    this.pendingDeleteId = id;
    this.pendingDeleteTitle = title;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
    this.pendingDeleteTitle = '';
  }

  confirmDelete(): void {
    if (this.pendingDeleteId === null) {
      this.closeDeleteConfirm();
      return;
    }
    const id = this.pendingDeleteId;
    const title = this.pendingDeleteTitle;
    this.closeDeleteConfirm();
    this.bookService.deleteBook(id).subscribe({
      next: () => {
        this.showToast(`"${title}" deleted.`, 'success');
        this.loadBooks();
      },
      error: () => {
        this.showToast('Failed to delete book.', 'error');
      },
    });
  }
}
