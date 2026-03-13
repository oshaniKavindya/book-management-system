import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BookService } from "../../services/book.service";
import { Book } from "../../models/book.model";

@Component({
  selector: "app-book-form",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./book-form.component.html",
  styleUrls: ["./book-form.component.css"],
})
export class BookFormComponent implements OnInit {
  isEditMode = false;
  bookId: number | null = null;
  submitting = false;
  errorMessage = "";
  showUpdateConfirm = false;

  book: Omit<Book, "id"> = {
    title: "",
    author: "",
    isbn: "",
    publicationDate: "",
  };

  constructor(
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditMode = true;
      this.bookId = +id;
      this.loadBook(this.bookId);
    }
  }

  loadBook(id: number): void {
    this.bookService.getBook(id).subscribe({
      next: (data) => {
        // Format date to YYYY-MM-DD for input[type=date]
        const dateStr = data.publicationDate
          ? new Date(data.publicationDate).toISOString().split("T")[0]
          : "";
        this.book = {
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          publicationDate: dateStr,
        };
      },
      error: () => {
        this.errorMessage = "Failed to load book details.";
      },
    });
  }

  onSubmit(): void {
    this.errorMessage = "";

    if (this.isEditMode && this.bookId !== null) {
      this.showUpdateConfirm = true;
      return;
    }

    this.submitting = true;

    this.bookService.createBook(this.book).subscribe({
      next: () =>
        this.router.navigate(["/books"], {
          queryParams: { toast: "created", title: this.book.title },
        }),
      error: () => {
        this.errorMessage = "Failed to create book. Please try again.";
        this.submitting = false;
      },
    });
  }

  closeUpdateConfirm(): void {
    this.showUpdateConfirm = false;
  }

  confirmUpdate(): void {
    this.closeUpdateConfirm();
    this.submitting = true;

    if (this.bookId === null) {
      return;
    }

    const updatedBook: Book = { id: this.bookId, ...this.book };
    this.bookService.updateBook(this.bookId, updatedBook).subscribe({
      next: () =>
        this.router.navigate(["/books"], {
          queryParams: { toast: "updated", title: this.book.title },
        }),
      error: () => {
        this.errorMessage = "Failed to update book. Please try again.";
        this.submitting = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(["/books"]);
  }
}
