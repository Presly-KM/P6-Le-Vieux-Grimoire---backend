require("dotenv").config();                                                 // On importe le module "dotenv" qui permet de charger les variables d'environnement à partir d'un fichier ".env". Cela permet de garder les informations sensibles (comme les mots de passe) hors du code source.
const { app } = require("./config/app");                                    // On importe l'application Express (le serveur) que l'on a configurée dans le fichier "app.js".
const { usersRouter } = require("./controllers/users.controllers");         // On importe le UserRouter que l'on a plus tôt exporté depuis books.controller. 
const { booksRouter } = require("./controllers/books.controllers");         // On importe le booksRouter que l'on a plus tôt exporté depuis books.controller. 

const PORT = process.env.PORT || 4000;                                      // On définit le port sur lequel le serveur va écouter les requêtes. Si la variable d'environnement PORT n'est pas définie, alors il utilisera le port 4000 par défaut.

app.get("/", (req, res) => res.send("Server is running !"));                // On définit une route GET pour la racine du serveur ("/"). Lorsque cette route est appelée, elle renvoie la réponse "Server is running !". Cela permet de vérifier que le serveur fonctionne correctement.
app.use("/api/auth", usersRouter);                                          // On utilise le UserRouter pour gérer les requêtes liées à l'authentification des utilisateurs. Toutes les routes définies dans le UserRouter seront préfixées par "/api/auth".
app.use("/api/books", booksRouter);                                         // On utilise le booksRouter pour gérer les requêtes liées aux livres. Toutes les routes définies dans le booksRouter seront préfixées par "/api/books".

app.listen(PORT, () => console.log(`Server is running on: ${PORT}`));       // On démarre le serveur et on l'écoute sur le port défini précédemment. Lorsque le serveur est démarré, il affiche un message dans la console indiquant sur quel port il est en cours d'exécution.



