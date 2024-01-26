const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const { body, validationResult } = require("express-validator");

const library_db = require("../library_db");

const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  await library_db.connect();
  const [
    numBooks,
    numAuthors,
    numBookInstances,
    numAvailableBookInstances,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    Author.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Genre.countDocuments({}).exec(),
  ]);
  await library_db.close();
  const props = {
    title: "Local Library Home",
    book_count: numBooks,
    author_count: numAuthors,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    genre_count: numGenres,
  };

  // Render index page with above dynamic information
  res.render("index", props);
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  // Connect with mongodb database
  await library_db.connect();
  const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec();
  res.render("book_list", { title: "Book List", book_list: allBooks });
  await library_db.close();
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  await library_db.connect();
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate([
      { path: "author" },
      { path: "genre" },
    ]),
    BookInstance.find({ book: req.params.id }),
  ]);

  // console.log(book);
  // console.log('bookInstances', bookInstances)
  res.render("book_detail", { book, bookInstances });

  await library_db.close();
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  await library_db.connect();
  const allAuthors = await Author.find({}).sort({ family_name: 1 }).exec();
  const allGenres = await Genre.find({}).sort({ name: 1 }).exec();
  res.render("book_form", {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres,
  });
  await library_db.close();
});

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  body("title", "Book title is required").trim().isLength({ min: 3 }).escape(),
  body("summary", "Summary is required").trim().isLength({ min: 3 }).escape(),
  body("isbn", "ISBN is required").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    await library_db.connect();

    const [allGenres, allAuthors] = await Promise.all([
      Genre.find({}).sort({ name: 1 }).exec(),
      Author.find({}).sort({ family_name: 1 }).exec(),
    ]);

    const book = new Book({
      title: req.body.title,
      summary: req.body.summary,
      isbn: req.body.isbn,
      author: req.body.author,
      genre: req.body.genre,
    });

    for (const genre in allGenres) {
      if (book.genre.includes(genre._id)) {
        genre.checked = true;
      }
    }

    if (!errors.isEmpty()) {
      res.render("book_create", {
        title: "Create Book",
        book,
        genres: allGenres,
        authors: allAuthors,
        errors: errors.array(),
      });
      return;
    } else {
      await book.save();
      res.redirect(book.url);
    }
    await library_db.close();
  }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book delete GET");
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book delete POST");
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book update GET");
});

// Handle book update on POST.
exports.book_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Book update POST");
});
