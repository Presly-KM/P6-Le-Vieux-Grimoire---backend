
const mongoose = require("mongoose");                                                                         // On importe mongoose qui est un ODM (Object Document Mapper) pour MongoDB. Il permet de manipuler les données de la base de données MongoDB en utilisant des objets JavaScript. Il facilite la création, la lecture, la mise à jour et la suppression de documents dans une base de données MongoDB.

const DB_URL =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_DOMAIN}`;     // Mise en place de l'url pour mongo. "Process.env" vient activer les données mis dans le fichier ".env" et qu'on souhaite ne pas afficher aux yeux du public (a savoir le nom d'utilisateur, le mot de passe et le domaine)
console.log("DB_URL:", DB_URL);


async function connect() {                                                                                    // On crée une fonction (asynchrone) pour se connecter à la base de données MongoDB. Le mot clé "async" permet d'utiliser le mot clé "await" à l'intérieur de la fonction.
  try {
    await mongoose.connect(DB_URL);
    console.log("Connected to DB");                                                                           // On utilise "await" pour attendre que la connexion à la base de données soit établie avant de continuer l'exécution du code. Si la connexion réussit, on affiche "Connected to DB" dans la console.
  } catch (e) {
    console.error(e);
  } 
}

connect();                                                                                                    // On appelle la fonction "connect" pour établir la connexion à la base de données MongoDB. Si la connexion échoue, une erreur sera affichée dans la console.
console.log("Running file mongo.js !");

