const mongoose = require("mongoose");                     // On importe mongoose qui est un ODM (Object Document Mapper) pour MongoDB. Il permet de manipuler les données de la base de données MongoDB en utilisant des objets JavaScript. Il facilite la création, la lecture, la mise à jour et la suppression de documents dans une base de données MongoDB.

const BookSchema = new mongoose.Schema({                  // Avec Mongoose.Schema on détermine la structure et la propriété des données concernant les livrés affichés Gestion ici d'un model/schéma d'affichage de la légende (ou description) des livres affichés.  
    userId: String,
    title: String,
    author: String,
    year: Number,
    genre: String,
    imageUrl: String,
    ratings: [
      {
        userId: String,
        grade: Number
      }
    ],
    averageRating: Number
  });
  
  const Book = mongoose.model("Book", BookSchema);       // le const book vient rendre BookSchema (ci-dessus) opérationnel. La constance Book avec l'aide de mongoose va fabriquer une base de donnée "Book" (le 1er argument) en utilisant le BookSchema (2eme argument) 

  module.exports = { Book };                             // On exporte ce nouveau schéma contenu dans "Book.js" pour l'importer dans "books.controller.js"