const mongoose = require("mongoose");                 // On importe mongoose qui est un ODM (Object Document Mapper) pour MongoDB. Il permet de manipuler les données de la base de données MongoDB en utilisant des objets JavaScript. Il facilite la création, la lecture, la mise à jour et la suppression de documents dans une base de données MongoDB.w

const UserSchema = new mongoose.Schema({              // Avec Mongoose.Schema on détermine la structure et la propriété des données concernant les utilisateurs se sont inscrits et donc enregistrés sur le site web 
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);      // le const User vient rendre UserSchema (ci-dessus) opérationnel. La constance User avec l'aide de mongoose va fabriquer une base de donnée "Book" (le 1er argument) en utilisant le BookSchema (2eme argument) 


module.exports = { User };                            // On exporte ce nouveau schéma contenu dans "User.js" pour l'importer dans "users.controller.js"

