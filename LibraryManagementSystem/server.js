
const express = require("express");

const app = express();
const PORT = 3000;

const books = [
  {
    id: 1,
    title: "Harry Potter",
    author: "J.K. Rowling",
    category: "Fantasy",
    quantity: 10,
    available: 8
  },
  {
    id: 2,
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    quantity: 5,
    available: 5
  },
  {
    id: 3,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self Help",
    quantity: 7,
    available: 6
  },
  {
    id: 4,
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    category: "Finance",
    quantity: 6,
    available: 4
  },
  {
    id: 5,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Classic",
    quantity: 4,
    available: 4
  }
];

const fields = [
  "id",
  "title",
  "author",
  "category",
  "quantity",
  "available"
];

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Library Management System API!");
});

function isValidBook(book) {
  return (
    Number.isSafeInteger(book.id) &&
    book.id > 0 &&
    ["title", "author", "category"].every(
      (field) =>
        typeof book[field] === "string" && book[field].trim()
    ) &&
    Number.isSafeInteger(book.quantity) &&
    book.quantity >= 0 &&
    Number.isSafeInteger(book.available) &&
    book.available >= 0 &&
    book.available <= book.quantity
  );
}

app.post("/api/books", (req, res) => {
  const book = req.body;

  if (!book || typeof book !== "object" || Array.isArray(book)) {
    return res.status(400).json({
      error: "Request body must be a JSON object"
    });
  }

  if (Object.keys(book).some((field) => !fields.includes(field))) {
    return res.status(400).json({
      error: "Request body contains an unknown field"
    });
  }

  if (!isValidBook(book)) {
    return res.status(400).json({
      error: "Invalid book details"
    });
  }

  if (books.some((item) => item.id === book.id)) {
    return res.status(409).json({
      error: "A book with this id already exists"
    });
  }

  const newBook = {
    ...book,
    title: book.title.trim(),
    author: book.author.trim(),
    category: book.category.trim()
  };

  books.push(newBook);

  return res.status(201).json({
    message: "Book created successfully",
    book: newBook
  });
});


app.get("/api/books", (req, res) => {
  res.json(books);
});


app.get("/api/books/search", (req, res) => {
  const title = req.query.title;

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      error: "A title query is required"
    });
  }

  const matches = books.filter((book) =>
    book.title.toLowerCase().includes(title.trim().toLowerCase())
  );

  return res.json(matches);
});


app.get("/api/books/:id", (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!book) {
    return res.status(404).json({
      error: "Book not found"
    });
  }

  return res.json(book);
});


app.post("/api/books/:id", (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!book) {
    return res.status(404).json({
      error: "Book not found"
    });
  }

  if (book.available === 0) {
    return res.status(409).json({
      error: "No copies are currently available"
    });
  }

  book.available -= 1;

  return res.json({
    message: "Book issued successfully",
    book
  });
});


app.post("/api/books/:id/return", (req, res) => {
  const book = books.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!book) {
    return res.status(404).json({
      error: "Book not found"
    });
  }

  if (book.available >= book.quantity) {
    return res.status(409).json({
      error: "All copies are already available"
    });
  }

  book.available += 1;

  return res.json({
    message: "Book returned successfully",
    book
  });
});


app.put("/api/books/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = books.findIndex(
    (item) => item.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Book not found"
    });
  }

  const updates = req.body;

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return res.status(400).json({
      error: "Request body must be a JSON object"
    });
  }

  if (Object.keys(updates).some((field) => !fields.includes(field))) {
    return res.status(400).json({
      error: "Request body contains an unknown field"
    });
  }

  if (updates.id !== undefined && updates.id !== id) {
    return res.status(400).json({
      error: "Book id cannot be changed"
    });
  }

  const updatedBook = {
    ...books[index],
    ...updates,
    id
  };

  if (!isValidBook(updatedBook)) {
    return res.status(400).json({
      error: "Invalid book details"
    });
  }

  updatedBook.title = updatedBook.title.trim();
  updatedBook.author = updatedBook.author.trim();
  updatedBook.category = updatedBook.category.trim();

  books[index] = updatedBook;

  return res.json({
    message: "Book updated successfully",
    book: updatedBook
  });
});


app.delete("/api/books/:id", (req, res) => {
  const index = books.findIndex(
    (item) => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Book not found"
    });
  }

  const [book] = books.splice(index, 1);

  return res.json({
    message: "Book deleted successfully",
    book
  });
});


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Library Management API is running on port ${PORT}`
    );
  });
}

module.exports = app;
