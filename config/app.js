const express = require("express");                                               // On commence par fabriquer le serveur : Cette constante va importer "Express" qui est un serveur.
const cors = require("cors");
const app = express();
require("./../db/mongo.js");                                                      // On importe la connexion à la base de données MongoDB. C'est le fichier mongo.js qui va s'en occuper.

const IMAGES_FOLDER = String(process.env.IMAGES_FOLDER);  
app.use(cors());
app.use(express.json());                                                          // On dit à Express d'utiliser le format JSON pour les données envoyées par le client. Express par défaut ne sait pas lire les "body" des requetes;
app.use("/" + process.env.IMAGES_PUBLIC_URL, express.static(IMAGES_FOLDER));      // Utilisation de express.static permettant aux utilisateurs d'accéder uniquement aux images parmi l'ensemble de nos dossiers personnels se trouvant dans notre répertoire VSCode. Il faut que les utilisateurs aillent sur l'Url "/images" et la ils auront alors le dossier uploads


module.exports = { app };