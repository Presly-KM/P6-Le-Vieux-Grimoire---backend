require("dotenv").config();    
const { app } = require("./config/app"); 
const { usersRouter } = require("./controllers/users.controllers");  // On importe le UserRouter que l'on a plus tôt exporté depuis books.controller. Les Routeurs on pour objectif d'organiser le code et le rendre + lisible
const { booksRouter } = require("./controllers/books.controllers");  // On importe le booksRouter que l'on a plus tôt exporté depuis books.controller. Les Routeurs on pour objectif d'organiser le code et le rendre + lisible

const PORT = process.env.PORT || 4000;  

app.get("/", (req, res) => res.send("Server is running !"));        // (cf modele express dans website) Ce "get" c'est une fonction qui accepte deux arguments : le 1er ce sera un chemin (on voit en effet avec les guillemets qu'on affaire a une string) et le deuxième argument c'est une fonction. Ca veut dire : A chaque fois que qqn fait une requete get sur le chemin "/" (autrement dit a la racine : http://localhost4000...) eh bien on va executer une fonction qui renvoi la réponse (res) "Server running"; CA VEUT EN GROS DIRE ; a chque fois que je veux aller sur localhost:4000 (4000 ou autre hein...) la réponse sera : le serveur is running (je crois)
app.use("/api/auth", usersRouter);                                  // Dès qui y'a une requête qui passe par /api/auth, il appelle le router correspondant (en l'occurence usersRouter). Les Routeurs ont pour objectif d'organiser le code et le rendre + lisible
app.use("/api/books", booksRouter);

app.listen(PORT, () => console.log(`Server is running on: ${PORT}`));



