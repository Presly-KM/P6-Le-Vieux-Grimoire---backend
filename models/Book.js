const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({                  // Gestion ici d'un model/schéma d'affichage de la légende (ou description) des livres affichés. Voir la partie "Models" du pdf des instructions données pas Openclassrooms pour vérifier quel shéma de description il faut respecter. On veut aussi enregistrer les différends contenus de books (userId,title, autohor, yearn genre, ratinges, averageRating) dans la base de données. Il s'afiit ici de la represnetaiton en javascript d"une entité en base de donnée 
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
  
  const Book = mongoose.model("Book", BookSchema);       // le const book vient rendre BookSchema (ci-dessus) opérationnel. Le code ci contre signifie que avec la const Book que mongoose  fabriquer une base de donnée "Book" (le 1er argument) en utilisant le BookSchema (2eme argument) 

  module.exports = { Book };                             // On exporte ce nouveau schéma contenu dans "Book.js" pour l'importer dans "books.controller.js"