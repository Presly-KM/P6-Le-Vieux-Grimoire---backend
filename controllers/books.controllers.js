const { upload } = require("../middlewares/multer");                                                    // Pour l'upload d'image en jpg on importe upload présent dans le fichier multer.js
const { Book } = require("../models/Book");                                                             // Pour la gestion de la base de données des livres enregistrées on importe Book.js (que l'on a exporté au préalable) qui contient la constante "Book" (renfermant le shema/structure des données des livres enregistrés : title, genre, author, etc). On va ensuite pouvoir utiliser cette constante "Book" importée dans la fonction "getbooks" tout en bas de cette page de code
const express = require("express");                                                                     // Pour la gestion des routes et de l'API on importe express. 
const jwt = require("jsonwebtoken")                                                                     // Cette librairie va permettre de prendre un objet, n'importe lequel et de le signer avec une clé privée. Il sert à la creation de token. 

const booksRouter = express.Router();                                                                   // Création d'un router pour la partie "livres". La fonction express.Router() dans Express.js crée un nouvel objet routeur capable de gérer les requêtes de manière modulaire et organisée.                                      
booksRouter.get("/bestrating", getBestRating);                                                          // On configure la route pour que le site puisse afficher les 3 livres les mieux notés. En effet quand on clique sur "meilleures notes" dans le site web, on voit que la requete est envoyée vers l'adresse : http://localhost:4000/api/books/bestrating.
booksRouter.get("/:id", getBookById);                                                                   // On configure la route pour que le site puisse afficher les livres en fonction de leur id. En effet quand on clique sur un livre dans le site web, on voit que la requete est envoyée vers l'adresse : http://localhost:4000/api/books/646fa4f309f421680eaBbed8. On a donc un id qui est présent dans l'url. Donc on va le récupérer depuis le req.params.id
booksRouter.get("/", getBooks);                                                                         // On configure la route pour que le site puisse afficher tous les livres. 
booksRouter.post("/", checkToken, upload.single("image"), postBook);                                    // On configure la route pour que le site puisse publier un livre. En effet quand on clique sur "publier" dans le site web, on voit que la requete POST est envoyée vers l'adresse : http://localhost:4000/api/books/. Le middleware checkToken permet de vérifier si l'utilisateur est bien connecté avant de lui permettre de publier un livre. On a aussi upload.single qui permet de rajouter une image (jpg) dans un req.file. Il est géré par multer qui a pour role de lire les data qui viennent d'un form et qui ne sont pas que du json.
booksRouter.delete("/:id", checkToken, deleteBook);                                                     // On configure la route pour que le site puisse supprimer un livre.  
booksRouter.put("/:id", checkToken, upload.single("image"), putBook);                                   // On configure la route pour que le site puisse modifier un livre. En effet quand on clique sur "modifier" dans le site web, on voit que la requete PUT est envoyée vers l'adresse : http://localhost:4000/api/books/646fa4f309f421680eaBbed8. 
booksRouter.post("/:id/rating", checkToken, postRating);                                                // On configure la route pour que le site puisse noter un livre. En effet quand on clique sur "noter" dans le site web, on voit que la requete POST est envoyée vers l'adresse : http://localhost:4000/api/books/646fa4f309f421680eaBbed8/rating. Le middleware checkToken qui permet de vérifier si l'utilisateur est bien connecté avant de lui permettre de noter un livre.

async function postRating(req, res) {                                                                   // Il s'agit ici de la fonction qui va permettre de noter un livre.  
    const id = req.params.id;                                                                           // On récupère l'id du livre en question (sur lequel on aura cliqué). 
    if (id == null || id == "undefined") {                                                              // Si l'id du livre est null ou undefined (c'est à dire qu'il n'existe pas) alors...
      res.status(400).send("Book id is missing");                                                       //...on a un message d'erreur qui affiche "book id is missing"
      return;                                                                                           // On arrete tout quand le test affiche "book id is missing" 
    }
    const rating = req.body.rating;                                                                     // On récupère le rating (qui vient d'etre mis) du livre
    const userId = req.tokenPayload.userId;                                                             // On récupère l'id de celui qui vient de noter le livre et qui se trouve dans le token 
    try {
      const book = await Book.findById(id);                                                             // On récupère le livre qui est dans la base de donnée par son id. En effet "Book" renvoie vers Book.js qui est l'endroit ou est géré la base de donnée (par mongo/mongoose) des livres. N.B : "Book" apelle automatiquement "BookSchema" qui va organiser dans la base de donnée l'agencement des informations à sauvegarder dans la base de donnée.
      if (book == null) {                                                                               // Si le livre n'existe pas (si on ne le trouve pas dans la base de donnée) alors...
        res.status(404).send("Book not found");                                                         // ...on a un message d'erreur qui affiche "book id is missing"
        return;                                                            
      }
      const ratingsInDb = book.ratings;                                                                 // On récupère les notes du livre déja présents dans la base de donnée
      const previousRatingFromCurrentUser = ratingsInDb.find((rating) => rating.userId == userId);      // On cherche si l'utilisateur actuelle n'a pas déja noté le livre antérieurement. Pour cela on regarde dnas la base de donnée des notations et on cherche une notation dont l'userId est égale à l'userId qui tente de noter une nouvelle fois (et qu'on a deja dans le token) 
      if (previousRatingFromCurrentUser != null) {                                                      // Si une notation antérieur du meme utilisateur est deja présente...
        res.status(400).send("You have already rated this book");                                       // ..."Vous avez déjà voté"
        return;                                                                                       
      } 
      const newRating = { userId, grade: rating };                                                      // Pour le nouveau rating on va tenter d'y encorporer l'id de l'utilisateur qui a noté ainsi que le rating qu'il a mis. L'user id sera pris du token payload (ligne 22 ) et le rating sera pris dans la ligne 21 
      ratingsInDb.push(newRating);                                                                      // on publie le new rating dans la base de donné des ratings
      book.averageRating = calculateAverageRating(ratingsInDb);                                         // Il s'agit ici de calculer la moyenne des votes (a partir en l'occurence de ratingsInDb qui contient les anciennes notation et la notation fraichement entrée)
      await book.save();                                                                                // On sauvergarde les nouvelles entrées d'information
      res.send("Rating posted");                                                                        // On envoie la réponse "Rating posted" pour dire que la notation a bien été prise en compte
    } catch (e) {                                                                                       // Gestion d'erreur
      console.error(e);                                                                                
      res.status(500).send("Something went wrong:" + e.message);                                       
    }
  }
  
  function calculateAverageRating(ratings) {                                                            // Il s'agit ici de la fonction qui va permettre de calculer la moyenne des notes. On lui passe en parametre les ratings (les notes)
    const sumOfAllGrades = ratings.reduce((sum, rating) => sum + rating.grade, 0);                      // On va additionner toutes les notes (rating.grade) en partant de 0 (le 0 est le point de départ de la somme). On utilise ici la méthode reduce qui va nous permettre de faire une somme de toutes les notes. La méthode reduce() exécute une fonction de rappel fournie sur chaque élément du tableau (ici ratings) et renvoie une valeur unique (ici la somme des notes). La fonction de rappel prend deux arguments : l'accumulateur (sum) et la valeur actuelle (rating). L'accumulateur est initialisé à 0, et pour chaque note, on ajoute la note actuelle à l'accumulateur.
    return sumOfAllGrades / ratings.length;                                                             // On divise la somme des notes par le nombre de notes pour obtenir la moyenne. ratings.length renvoie le nombre total de notes dans le tableau ratings.
  }

async function getBestRating(req, res) {                                                                // Il s'agit d'agencer les 3 livres avec les meilleurs ratings
    try {
      const booksWithBestRatings = await Book.find().sort({ rating: -1 }).limit(3);                     // On va chercher dans la base de donnée les livres et on va les trier par note (rating) de manière décroissante (de la plus haute note à la plus basse note) et on limite le résultat à 3 livres (limit(3)). On a donc ici une liste de 3 livres avec les meilleures notes.
      booksWithBestRatings.forEach((book) => {                                                          // Pour chaque livre...
        book.imageUrl = getAbsoluteImagePath(book.imageUrl);                                            // ...On modifie l'Url de l'image du livre de sorte que l'adresse de l'image soit notre nouveau shéma / stucture d'écriture d'adresse "filename" que la fonction getAbsoluteImagePath applique.
      });
      res.send(booksWithBestRatings);                                                                   // On envoie la réponse contenant les livres avec les meilleures notes
    } catch (e) {                                                                                       // Gestion d'erreur
      console.error(e);
      res.status(500).send("Something went wrong:" + e.message);
    }
  }
  

async function putBook(req, res) {                                                                      // Il s'agit ici de modifier les livres deja publiées
    const id = req.params.id;                                                                           // On récupère l'id du livre en question (sur lequel on aura cliqué).
    const book = JSON.parse(req.body.book);                                                             // On récupère le livre que l'on veut modifier. On le parse car il s'agit d'une chaine de caractère (string) et on veut en faire un objet (JSON.parse). On a donc un objet book qui contient les nouvelles informations du livre (title, author, year, genre).
    try {
    const bookInDb = await Book.findById(id);                                                           // Dans la base de donnée des "livres" on cherche un livre par son identifiant 
    if (bookInDb == null) {                                                                             // Si l'id du livre en question n'est pas trouvé ou si il n'existe pas...
        res.status(404).send("Book not found");                                                         // ..."livre pas trouvé"
        return;                                                                                      
    }                                                                                                   // Penchons nous maintenant sur le cas ou qqn de malveillant veut supprimer un livre qui ne lui appartient pas. Si on ne fait rien cela est possible malhereusement. Le checktoken ne suffit pas. Car il suffit juste que l'utilisateur malveillant copie l'adresse id du livre en question à supprimer et qu'il le supprime. Le Navigateur ne détectera pas qu'il s'agit alors d'un autre utilisateur que celui qui a publié le livre à supprimer. Car alors non seulement il rendra l'option "supprimer" disponible mais aussi il le supprimera.
    const userIdInDb = bookInDb.userId;                                                                 // bookInDb intègre plusiuers propriété dont celle de l'id de l'utilisateur en lien avec le livre selectionné (userId). La constante userIdInDb contient donc l'identifiant de l'utilisateur en lien avec le livre selectionné.
    const userIdInToken = req.tokenPayload.userId;                                                      // On récupère l'id de celui qui veut actuellement supprimer le livre. On récupère dans le tokenPayload (situé dans la fonction checkToken) qui contient le userId de la personne connectée (et malveillante). 
    if (userIdInDb != userIdInToken) {                                                                  //  Si l'id de l'utilisateur à l'origine du livre n'est pas le même que l'utilisateur qui veut le modifier...
        res.status(403).send("You cannot modify other people's books");                                 //... Alors message qui dit "tu ne peux pas modifier le livre d'un autre
        return;                                                         
    } 
   
    const newBook = {};                                                                                 //"newBook" est un objet vide dans lequel on va rajouter uniquement les propriétés (ci dessous) que l'on veut dessus. (title author year et genre)              
    if (book.title) newBook.title = book.title;                                                         // donc newBook qui ne contient rien va récupérer les champs déja remplies pour povoir ainsi modifier a partir de ce qui a deja été écris.         
    if (book.author) newBook.author = book.author;                      
    if (book.year) newBook.year = book.year;                            
    if (book.genre) newBook.genre = book.genre;                         
    if (req.file != null) newBook.imageUrl = req.file.filename;                                         // si le req.file qui contient donc l'image existe eh bie, il faut que l'url de l'image corresponde au nom de l'image trouvé dans file

    await Book.findByIdAndUpdate(id, newBook);                                                          // La fonction findByIdAndUpdate cherche et trouve l'id du livre concerné et applique la modification à ce livre avec les nouvelles informations contenus dans la constante "newbook"
    res.send("Book updated !");                                                                         // On envoie la réponse "Book updated !"
  } catch (e) {                                                                                         // Gestion d'erreur
    console.error(e);                                                   
    res.status(500).send("Something went wrong:" + e.message);                                       
  }
}

async function deleteBook(req, res) {                                                                   // Il s'agit ici de supprimer un livre
    const id = req.params.id;                                                                           // On récupère l'id du livre en question (sur lequel on aura cliqué).
    try {                                                                                               // On prévoit les problèmes/erreurs de connexions en mettant notre bloc de code das un try and catch
        const bookInDb = await Book.findById(id);                                                       // Dans la base de donnée des "livres" cherche et trouve un livre par son identifiant 
        if (bookInDb == null) {                                                                         // Si l'id du livre en question n'est pas trouvé ou, si il n'xiste pas...
            res.status(404).send("Book not found");                                                     // ..."livre pas trouvé"
            return;                                                     
        }                                                                                               // Penchons nous maintenant sur le cas ou qqn de malveillant veut supprimer un livre qui ne lui appartient pas. Si on ne fait rien cela est possible malhereusement. Le checktoken ne suffit pas (voir pourquoi dans video "delete book" 12:26). Car il suffit juste que l'utilisateur malveillant copie l'adresse id du livre en question à supprimer et qu'il le supprime. Le Navigateur ne détectera pas qu'il s'agit alors d'un autre utilisateur que celui qui a publié le livre à supprimer. Car alors non seulement il rendra l'option "supprimer" disponible mais aussi il le supprimera.
        const userIdInDb = bookInDb.userId;                                                             // bookInDb intègre plusiuers propriété dont celle de l'id de l'utilisateur en lien avec le livre selectionné (userId). La constante userIdInDb contient donc l'identifiant de l'utilisateur en lien avec le livre selectionné.
        const userIdInToken = req.tokenPayload.userId;                                                  // On récupère l'id de celui qui veut actuellement supprimer le livre. On récupère dans le tokenPayload (situé dans la fonction checkToken) qui contient le userId de la personne connectée (et malveillante). 
        if (userIdInDb != userIdInToken) {                                                              // Si l'id de l'utilisateur à l'origine du livre n'est pas le même que l'utilisateur qui veut le supprimer...
            res.status(403).send("You cannot delete other people's books");                             // ...Alors on renvoie un message affichant "tu ne peux pas supprimer le livre d'un autre
            return;                                                         
        }                                                                                               // Sinon si y'a pas de malveillance.. Alors on suit le process normal qui est de supprimer le livre
        await Book.findByIdAndDelete(id);                                                               // On utilise la fonction findByIdAndDelete(id) pour supprimer le livre souhaité par la selection de son Id
        res.send("Book deleted");                                                                       // On renvoie (Book deleted !)
    } catch (e) {                                                                                       // Gestion d'erreur...
        console.error(e);                                                                               // 
        res.status(500).send("Something went wrong:" + e.message);                                      // ...Le message "Something went wrong" + le message d'erreur s'affichent
    }
}

function checkToken(req, res, next) {                                                                   // On a généré un token dans users.controller.js, maintenant on cherche ici à vérifier ce token. Comme toutes les autres fonctions elle va recevoir un req, res, et un next. Le next est utilisé pour appeler le middleware d'après. 
    const headers = req.headers;                                                                        // On récupère le headers car c'est la que se trouve la partie qui nous interesse : "authorization"
    console.log("headers:", headers);
    const authorization = headers.authorization;                                                        // On récupère donc directement le "authorization" pour vérifier ce qu'il affiche (présence d'autorisation avec un token )
    if (authorization == null) {                                                                        // Si déjà dés le départ la partie authrorization ne s'affiche pas ou n'existe pas...
        res.status(401).send("Unauthorized");                                                           // ...Alors le message "unauthorized" s'affiche
        return;                                                                                         // On arrete tout quand le test affiche "unauthorized"  car on n'a pas envie d'appeler "next()" 
    }
    const token = authorization.split(" ")[1];                                                          // Vu que authorization affiche une string (bearer letokendufront) alors on va séparer en deux ce dernier.
    console.log("token:", token);
    try {                                                                                               // Plus haut on a vérifié la présence d'un token : genre y'avait-il la mention authorisation + token ? Mais maintenant on veut vérifier non plus si il est présent mais si ce dernier est valide !
        const jwtSecret = String(process.env.JWT_SECRET);                                               // On va chercher le secret JWT dans le fichier .env. 
        const tokenPayload = jwt.verify(token, jwtSecret);                                              // On va vérifier le token avec la méthode "verify" de la librairie JWT. On lui passe le token et le secret JWT. 
        if (tokenPayload == null) {                                                                     // Si le tokenPayload est null (donc que le token n'est pas valide) alors...
            res.status(401).send("Unauthorized");                                                       // ...On a un message d'erreur "unauthorized"
            return;
        }
        req.tokenPayload = tokenPayload;                                                                // Sinon le contenu de ce token etant considéré valide le token décodé (tokenPayload) va être rajouté dans le body de la requete (sur une propriété qu'on appelle tokenpayload) afin que l'userId désormais décodé soit pris en compte
        console.log("tokenPayload:", tokenPayload);
        next();
    } catch (e) {                                                                                       // Gestion d'erreur
        console.error(e);
        res.status(401).send("Unauthorized");                                                           // ...On a un message d'erreur "unauthorized"
    }
}

async function getBookById(req, res) {                                                                  // Il s'agit ici de la fonction qui va permettre de récupérer un livre par son id. 
    const id = req.params.id;                                                                           // On récupère l'id du livre en question (sur lequel on aura cliqué).
    try {
        const book = await Book.findById(id);                                                           // Ici le livre est cherché dans la base de donnée par son Id
        if (book == null) {                                                                             // Si on ne le trouve pas
            res.status(404).send("Book not found");                                                     // Le message : "le livre n'a pas été trouvé" nous est renvoyé
            return;
        }
        book.imageUrl = getAbsoluteImagePath(book.imageUrl);                                            // On modifie l'Url de l'image du livre de sorte que l'adresse de l'image soit notre nouveau shéma / stucture d'écriture d'adresse "filename" que la fonction getAbsoluteImagePath applique.
        res.send(book);                                                                                 // Le livre en question est renvoyé (affiché)
    } catch (e) {                                                                                       // Gestion d'erreur
        console.error(e);
        res.status(500).send("Something went wrong:" + e.message);
    }
}

async function postBook(req, res) {                                                                     // Il s'agit ici de la fonction qui va permettre de publier un livre.
    const stringifiedBook = req.body.book;                                                              
    const book = JSON.parse(stringifiedBook);                                                           // On veut maintenant enregistrer le "book" dans la base de donnée, le probleme est que book affiche une suite de string (chaine de caractères). Si par exemple on cherche au sein du "book" seulement le titre, en tapant dans la console "book.title", celle-ci affiche "title : undefined" parce qu'il s'agit de chaine de caractères, donc illisible pour la console. Donc on transforme le string en objet par JSON.parse. Désormais on peut acceder au book.title. Maintenant qu'on peut acceder au contenu de book qui a été objectifié on peut enregistrer l'ensemble dans la base de donnée.
    const filename = req.file.filename;                                                                 // filename va se charger (en entrant dans file --> puis filename) de récupérer le nom de l'image publiée. On tire ici bénéfice du fonctionnement des middlewares. 
    book.imageUrl = filename;                                                                           // Avant d'enregistrer notre book en base de donnée on va lui ajouter une Url d'image qui est juste notre filename (le nom de l'image). Ici on va prendre le filename qui se trouve dans "file" (file.filename) à savoir par exemple "1685035815558.jpg" et déterminer que l'URL de l'image (image.Url) soit plutôt le nom de l'image en question. 
    try {
        const result = await Book.create(book);                                                         // Le résultat de la requete (le fait d'appuyer sur "publier" tout simplement) va être que la base de données liée aux livres (Book) va intégrer book (le livre et la description qu'on lui a donné) que l'on vient de publier (par la méthode POST )
        res.send({ message: "Book posted", book: result });                                             // La réponse 0 la requete est "Le livre a été posté". A coté on a aussi ajouté le book tel que désormais affiché dans la base de donnée.
    } catch (e) {                                                                                       // Gestion d'erreur
        console.error(e);
        res.status(500).send("Something went wrong:" + e.message);                                      // En cas d'erreur on renvoie une réponse d'erreur 500 suivie de "Something went wrong" + diffusion en front (par e.message) du message d'erreur affiché sur la console.
    }
}


async function getBooks(req, res) {                                                                     // On veut ici récupérer des livres (lorsqu'on rentre dans le site on veut voir voir les livres deja present dans le site donc en base de donnée). On gère alors ici la requete(req) et la réponse(res)
    try {
        const books = await Book.find();                                                                // On va chercher les livres disponibles dans la base de donnée. On utilise la méthode find() de Mongoose pour récupérer tous les livres de la collection "books". "books" est ici une variable locale qui entre pas en conflit avec les autres "books" du code.
        books.forEach((book) => {                                                                       // Pour chaque livre (book) on va modifier son imageURL (l'url conduisant à l'image et permettant ainsi son affichage)...
            book.imageUrl = getAbsoluteImagePath(book.imageUrl);                                        // ...Tu modifies l'url de l'image du livre de sorte que l'adresse de l'image soit notre nouveau shéma d'écriture d'adresse "filename" que la fonction getabsoluteImagePath applique. 
        });
        res.send(books);                                                                                // La réponse (res) est l'envoie (l'affichage) des livres présents dans la base de donnée. 
    } catch (e) {                                                                                       // Gestion d'erreur
        console.error(e);
        res.status(500).send("Something went wrong:" + e.message);
    }
}


function getAbsoluteImagePath(fileName) {                                                              // Il s'agit ici de la fonction qui va permettre de modifier l'url de l'image d'un livre de sorte que l'adresse de l'image soit notre nouveau shéma d'écriture d'adresse "filename" que la fonction getabsoluteImagePath applique. Le paramètre "(FileName)" dans la ligne de code ci-contre sera remplacé par"(book.imageUrl)" comme par exemple dans la ligne 179
    return process.env.PUBLIC_URL + "/" + process.env.IMAGES_PUBLIC_URL + "/" + fileName;              // Il s'agit ici d'une autre manière d'écrire : "http://localhost:4000/images/" + book.imageUrl;" -->  Ainsi on choisi de mettre "http://localhost:4000/" dans un process.env --> (PUBLIC_URL) et "/images/" dans un process.env --> (IMAGES_PUBLIC_URL) et on rajoute le nom de l'image ((fileName) --> ex: 1685035815558.jpg).
}


module.exports = { booksRouter };                                                                      // On exporte le router booksRouter pour l'utiliser dans un autre fichier