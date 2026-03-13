using Microsoft.AspNetCore.Mvc;
using BookApi.Models;

namespace BookApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BooksController : ControllerBase
    {
        // In-memory list to store books
        private static List<Book> _books = new List<Book>
        {
            new Book { Id = 1, Title = "Clean Code", Author = "Robert C. Martin", Isbn = "978-0132350884", PublicationDate = new DateTime(2008, 8, 1) },
            new Book { Id = 2, Title = "The Pragmatic Programmer", Author = "David Thomas", Isbn = "978-0201616224", PublicationDate = new DateTime(1999, 10, 20) }
        };

        private static int _nextId = 3;

       // get all books
        [HttpGet]
        public ActionResult<IEnumerable<Book>> GetAll()
        {
            return Ok(_books);
        }

        // get book by id
        [HttpGet("{id}")]
        public ActionResult<Book> GetById(int id)
        {
            var book = _books.FirstOrDefault(b => b.Id == id);
            if (book == null)
                return NotFound(new { message = $"Book with ID {id} not found." });

            return Ok(book);
        }

        // create new book
        [HttpPost]
        public ActionResult<Book> Create([FromBody] Book book)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            book.Id = _nextId++;
            _books.Add(book);

            return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
        }

        // update existing book
        [HttpPut("{id}")]
        public ActionResult<Book> Update(int id, [FromBody] Book updatedBook)
        {
            var existingBook = _books.FirstOrDefault(b => b.Id == id);
            if (existingBook == null)
                return NotFound(new { message = $"Book with ID {id} not found." });

            existingBook.Title = updatedBook.Title;
            existingBook.Author = updatedBook.Author;
            existingBook.Isbn = updatedBook.Isbn;
            existingBook.PublicationDate = updatedBook.PublicationDate;

            return Ok(existingBook);
        }

        // delete book
        [HttpDelete("{id}")]
        public ActionResult Delete(int id)
        {
            var book = _books.FirstOrDefault(b => b.Id == id);
            if (book == null)
                return NotFound(new { message = $"Book with ID {id} not found." });

            _books.Remove(book);
            return NoContent();
        }
    }
}
