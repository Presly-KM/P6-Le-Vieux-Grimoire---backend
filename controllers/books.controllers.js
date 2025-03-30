const { upload } = require("../middlewares/multer");
const { Book } = require("../models/Book");
const express = require("express");
const jwt = require("jsonwebtoken")

const booksRouter = express.Router();
booksRouter.get("/bestrating", getBestRating);
booksRouter.get("/:id", getBookById);
booksRouter.get("/", getBooks);
booksRouter.post("/", checkToken, upload.single("image"), postBook);     // Après avoir cliqué sur ajouter livre, rempli le formulaire qui suit et appuyer sur "publier" on remarque le site envoie une requête POST http://localhost:4000/api/books 
booksRouter.delete("/:id", checkToken, deleteBook);
booksRouter.put("/:id", checkToken, upload.single("image"), putBook);  
booksRouter.post("/:id/rating", checkToken, postRating);

async function postRating(req, res) {                                    // 
    const id = req.params.id;                                              // On récupère l'id du livre en question. L'id on l'a dans l'url. Exemple : On clique sur un bouquin dans le site. La page web va s'actualiser pour afficher une page contenant le livre sur lequel on a cliqué et indiquer dans la barre d'adresse : localhost:3000/livre/646798270acd094b8d586fb. Ici le params c'est tout simplement la dernière partie de l'adresse à savoir : "646798270acd094b8d586fb"
    if (id == null || id == "undefined") {                                 // Le site affiche bizarment undefined au niveau de l'id du book. le client nous renvoie qu'on un undefined en string alors qu'il n'est pas sensée faire ça.  Pour parer a cette éventualité on gère le cas échéant dans la ligne de code ci-contre. Comme le probleme concernne un undined en string on met également un undifined en string dans le code de test.
      res.status(400).send("Book id is missing");                          // Dans le cas ou l'id du livre n'existe pas ou est undifined alors "book id is missing"
      return;                                                              //
    }
    const rating = req.body.rating;                                        // On récupère le rating (qui vient d'etre mis) du livre
    const userId = req.tokenPayload.userId;                                // On récupère l'id de celui qui vient de noter le livre et qui se trouve dans le token (nous on veut prendre l'user id du token et non pas du payload. Car a partir du token c'est plus sur)
    try {
      const book = await Book.findById(id);                                // On récupère le livre qui est dans la base de donnée par son id. En effet "Book" renvoie vers Book.js qui est l'endroit ou est géré la base de donnée (par mongo/mongoose) des livres. N.B : "Book" apelle automatiquement "BookSchema" qui va organiser dans la base de donnée l'agencement des informations à sauvegarder dans la base de donnée.
      if (book == null) {                                                  // 
        res.status(404).send("Book not found");                            //
        return;                                                            //
      }
      const ratingsInDb = book.ratings;                                                              // On récupère les notes du livre déja présents dans la base de donnée
      const previousRatingFromCurrentUser = ratingsInDb.find((rating) => rating.userId == userId);   // On cherche si l'utilisateur actuelle n'a pas déja noté le livre antérieurement. Pour cela on regarde dnas la base de donnée des notations et on cherhce une notation dont l'user id est égale à l'user id qui tente de noter une nouvelle fois (et qu'on a deja dans le token) 
      if (previousRatingFromCurrentUser != null) {                                                   // Si une notation antérieur du meme utilisateur est deja présente...
        res.status(400).send("You have already rated this book");                                    // ..."Vous avez déjà voté"
        return;                                                                                      // 
      } 
      const newRating = { userId, grade: rating };                                                    // Pour le nouveau rating on va tenter d'y encorporer l'id de l'utilisateur qui a noté ainsi que le rating qu'il a mis. L'user id sera pris du token payload (ligne 22 ) et le rating sera pris ans la ligne 21 
      ratingsInDb.push(newRating);                                                                    // on push le new rating dans la base de donné des ratings
      book.averageRating = calculateAverageRating(ratingsInDb);                                       // Il s'agit ici de calculer la moyenne des votes (a partir en l'occurence de ratingsInDb qui contient les anciennes notation et la notation fraichement entrée)
      await book.save();                                                                              // On sauvergarde les nouvelles entrées d'information
      res.send("Rating posted");                                                                      //
    } catch (e) {                                                                                     //
      console.error(e);                                                                               //
      res.status(500).send("Something went wrong:" + e.message);                                      //
    }
  }
  
  function calculateAverageRating(ratings) {                                                          // (PAS TROP COMPRIS, A REECOUTER)
    const sumOfAllGrades = ratings.reduce((sum, rating) => sum + rating.grade, 0);                    // Ratings.reduce --> est destinée à transformer une array en une seule valeur. Il prends donc la somme( sumoffAllGrades), il fait un reduce dessus. A partir de ce reduce, la fonction reduce prends deux parametres, le 1er argument est une fonction qui va itérer sur chaque valeur de l'array (Le singulier de ratings c'est rating donc ça signifie pour chaque note), le deuxième argument c'est "0" donc la valeur de base
    return sumOfAllGrades / ratings.length;                                                           //  Alors deja pour faire une moyenne on a besoin de la longueur de l'array (ratings.length). Puis on additione tous les grades ensembles (sumOffAllGrades).. Donc ici la l'average rating, ou autrement dit la moyenne des notations est égale a la somme des notation divisé par la longueur 
  }

async function getBestRating(req, res) {                                          // Il s'agit d'agencer les 3 livres avec les meilleurs ratings
    try {
      const booksWithBestRatings = await Book.find().sort({ rating: -1 }).limit(3); // On va demander a Mongo de faire l'agencement des 3 livres les mieux notés parmis les livres de la bases de données (cf explication interessante a ecouter 3:30/10:25 "Get best ratings"). Book ici c'est quoi ? C'est en réalité mongoose.model. Donc "Book" appartient a mongoose et ensuite ce find c'est mongoose aussi, le sort c'est une propriété de find donc monggose aussi et enfin limit est une propriété de sort qui est une propriété de find qui est une propriété de "Book" aussi une propriété de mongoose. Donc toutes ses éléments sont de mongoose donc en gros c'est mongoose qui se charge bien d'agencer les ratings. EXPLICATION CODE CI CONTRE : ".sort({ ratings:-1})" signifie qu'il les agences sur la propriété "ratings" et -1 veut dire par ordre décroissant ; "limit" signifie que sur les nombreux livres disponibles on n'en garde que 3 en tant que meilleurs ratings
      booksWithBestRatings.forEach((book) => {                                      // Pour chaque livre
        book.imageUrl = getAbsoluteImagePath(book.imageUrl);                        // Récupère l'url/adresse de l'image (en y incorporant l'effet filename) du livre en question à partir de book.imageUrl (cf trés claire explication 9:10/10:25)
      });
      res.send(booksWithBestRatings);
    } catch (e) {
      console.error(e);
      res.status(500).send("Something went wrong:" + e.message);
    }
  }
  

async function putBook(req, res) {                                      // Il s'agit ici de modifier les livres deja publiées
    const id = req.params.id;                                             // On voit que dans la ligne(11) on a l'id du livre qui est présent dans les params. Donc déja on va le récupérer depuis le req.params.id                            // Quand on regarde dans le body on voit qu'on a une propriété qui s'appelle book et qui est stringifié : book: '{"userId":"6470828e8988359d6cf70b324","title":"ol","author":"ol","year": 123, "genre":"ol"}' 
    const book = JSON.parse(req.body.book);
    try {
    const bookInDb = await Book.findById(id);                     // Dans la base de donnée des "livres" cherche et trouve un livre par son identifiant 
    if (bookInDb == null) {                                       // Si tu ne trouve pas l'id du livre en question , si il n'xiste pas...
        res.status(404).send("Book not found");                     // ..."livre pas trouvé"
        return;                                                     //
    }                                                             // Penchons nous maintenant sur le cas ou qqn de malveillant veut supprimer un livre qui ne lui appartient pas. Si on ne fait rien cela est possible malhereusement. Le checktoken ne suffit pas (voir pourquoi dans video "delete book" 12:26). Car il suffit juste que l'utilisateur malveillant copie l'adresse id du livre en question à supprimer et qu'il le supprime. Le Navigateur ne détectera pas qu'il s'agit alors d'un autre utilisateur que celui qui a publié le livre à supprimer. Car alors non seulement il rendra l'option "supprimer" disponible mais aussi il le supprimera.
    const userIdInDb = bookInDb.userId;                           //  bookInDb intègre plusiuers propriété dont celle de l'id de l'utilisateur en lien avec le livre selectionné (userId). La constante userIdInDb contient donc l'identifiant de l'utilisateur en lien avec le livre selectionné.
    const userIdInToken = req.tokenPayload.userId;                //  C'est bien beau... On connait maintenant l'id de celui qui a ajouté le livre qu'un potentiel utilisateur malveillant veut maintenant supprimer. Mais comment savoir quel est maintenant l'id de l'utilisateur malveillant autrement dit de celui qui veut actuellement supprimer le livre ? Eh bien on le récupère dans le tokenPayload (situé dans la fonction checkToken) qui contient le userId de la personne connectée (et malveillante). ATTENTION les fonctions ne communiquent pas entre elles. Donc pour utiliser le Tokenpayload inscrit dans CheckToken pour l'utiliser dans Deletebook il faut inscrire "req.tokenPayload"avant le mécanisme "next();" (cf ligne 132) a
    if (userIdInDb != userIdInToken) {                            //  Si l'id de l'utilisateur à l'origine du livre n'est pas le même que l'utilisateur qui veut le supprimer...
        res.status(403).send("You cannot modify other people's books");      //... Alors message qui dit "tu ne peux pas supprimer le livre d'un autre
        return;                                                         //
    } 
   
    const newBook = {};                                                 // "newBook" est un objet vide dans lequel on va rajouter uniquement les propriétés (ci dessous) que l'on veut dessus.
    if (book.title) newBook.title = book.title;                         // donc newBook qui ne contient rien va récupérer les champs déja remplies pour povoir ainsi modifier a partir de ce qui a deja été écris.
    if (book.author) newBook.author = book.author;                      //
    if (book.year) newBook.year = book.year;                            //
    if (book.genre) newBook.genre = book.genre;                         //
    if (req.file != null) newBook.imageUrl = req.file.filename;

    await Book.findByIdAndUpdate(id, newBook);
    res.send("Book updated !");
  } catch (e) {                                                         // Gestion d'erreur
    console.error(e);                                                   //
    res.status(500).send("Something went wrong:" + e.message);          //
  }
}

async function deleteBook(req, res) {
    const id = req.params.id;                                       // On voit que dans la ligne(11) on a l'id (du livre probablement ?) qui est présent dans les params. Donc déja on va le récupérer depuis le req.params.id 
    try {                                                           // On prévoit les problèmes/erreurs de connexions en mettant notre bloc de code das un try and catch
        const bookInDb = await Book.findById(id);                     // Dans la base de donnée des "livres" cherche et trouve un livre par son identifiant 
        if (bookInDb == null) {                                       // Si tu ne trouve pas l'id du livre en question , si il n'xiste pas...
            res.status(404).send("Book not found");                     // ..."livre pas trouvé"
            return;                                                     //
        }                                                             // Penchons nous maintenant sur le cas ou qqn de malveillant veut supprimer un livre qui ne lui appartient pas. Si on ne fait rien cela est possible malhereusement. Le checktoken ne suffit pas (voir pourquoi dans video "delete book" 12:26). Car il suffit juste que l'utilisateur malveillant copie l'adresse id du livre en question à supprimer et qu'il le supprime. Le Navigateur ne détectera pas qu'il s'agit alors d'un autre utilisateur que celui qui a publié le livre à supprimer. Car alors non seulement il rendra l'option "supprimer" disponible mais aussi il le supprimera.
        const userIdInDb = bookInDb.userId;                           //  bookInDb intègre plusiuers propriété dont celle de l'id de l'utilisateur en lien avec le livre selectionné (userId). La constante userIdInDb contient donc l'identifiant de l'utilisateur en lien avec le livre selectionné.
        const userIdInToken = req.tokenPayload.userId;                //  C'est bien beau... On connait maintenant l'id de celui qui a ajouté le livre qu'un potentiel utilisateur malveillant veut maintenant supprimer. Mais comment savoir quel est maintenant l'id de l'utilisateur malveillant autrement dit de celui qui veut actuellement supprimer le livre ? Eh bien on le récupère dans le tokenPayload (situé dans la fonction checkToken) qui contient le userId de la personne connectée (et malveillante). ATTENTION les fonctions ne communiquent pas entre elles. Donc pour utiliser le Tokenpayload inscrit dans CheckToken pour l'utiliser dans Deletebook il faut inscrire "req.tokenPayload"avant le mécanisme "next();" (cf ligne 132) a
        if (userIdInDb != userIdInToken) {                            //  Si l'id de l'utilisateur à l'origine du livre n'est pas le même que l'utilisateur qui veut le supprimer...
            res.status(403).send("You cannot delete other people's books");      //... Alors message qui dit "tu ne peux pas supprimer le livre d'un autre
            return;                                                         //
        }                                                             // Sinon si y'a pas de malveillance.. Alors du suit le process normal qui est de supprimer le livre
        await Book.findByIdAndDelete(id);                                 // On utilise la fonction findByIdAndDelete(id) pour supprimer le livre souhaité par la selecition de son Id
        res.send("Book deleted");                                         // On renvoie (Book deleted !)
    } catch (e) {                                                       // Si y'a une erreur...
        console.error(e);                                                 // 
        res.status(500).send("Something went wrong:" + e.message);        // ...en guise de réponse on a "Something went wrong" + le message d'erreur
    }
}

function checkToken(req, res, next) {                         // On a généré un token dans users.controller.js, maintenant on cherche ici à vérifier ce token. Comme toutes les autres fonctions elle va recevoir un req, res, et un next et le next c'est la manière d'appeller le middleware d'apres. Quand on ajoute un livre un token nous est envoyé quand on appuie sur publier le formulaire et que docn en envoie la requete on consulte le console log on voit la partie Payload contenant un book (user id, title, author, year) et image (binary) et quand on se rend dans la partie Headers on voit une ligne "Authorization: Bearer puis le token que nous lui avons envoyé quand l'utilisateur s'est logué (suite de caractères assez long mais pris en photo sur mon phone"). Donc nous on va regarder que à chauqe fois qu'on publie (par une requete POST) un livre (est-ce vraiemnt le moment opportun pour verifier au moment qu'on publie un livre ? ) La partie authorizarion affiche bien bearer puis "espace" puis le token
    const headers = req.headers;                                // On récupère le headers car c'est la que se trouve la partie qui nous interesse : "authorization"
    console.log("headers:", headers);
    const authorization = headers.authorization;                // On récupère donc directement le "authorization" pour pourvoir voir ce qu'il affiche (présence d'autorisation avec un token )
    if (authorization == null) {                                // Si déjà dés le départ la partie authrorization ne s'affiche pas ou n'existe pas...
        res.status(401).send("Unauthorized");                     // ...Alors message me dit "unauthorized"
        return;                                                   // On arrete tout quand le test affiche "unauthorized"  car on n'a pas envie d'appeler "next()" (ligne 133) pour passer à la condition suivante (on rapelle que next permet pour les middleware de passer au middleware suivant) si de toute manière l'utilisateur est "unauthorized". RAPPEL on dit on dit unauthorized psk on a pas de token. C'est à dire pas de : Bearer + espace + le nom du token. De toute façon à chaque fois qu'on envoie un token c'est de toute manière organisée en "authorization : bearer + espace + le nom du token". C'est la norme dans le W3C
    }
    const token = authorization.split(" ")[1];                  // Vu que authorization affiche une string (bearer letokendufront) alors on va spliter en deux ce dernier. En tapant "Bearer letokendufront".split ("") on sépare ici une string en array. C'est pas bon car la il split par caractères alors que nous on prefere qu'il split au niveau de l'espace donc ce qu'on fait c'est qu'on met un espace entre les deux guillemet qui se trouvent entre parenthèses comme ceci--> .split(" ") là c'est parfait. Le résultat est alors le suivant : ['Bearer', 'letokendufront']. Mais c'est pas encore tout car nous ce qu'on veut c'est le deuxième élément de l'array donc "Bearer letokendufront".split(" ")[1] le résultat est alors : 'letokendufront'
    console.log("token:", token);
    try {                                                       // Plus haut on a vérifié la présence d'un token : genre y'avait-il la mention authorisation + token ? Mais maintenant on veut vérifier non plus si il est présent mais si ce dernier est valide !
        const jwtSecret = String(process.env.JWT_SECRET);
        const tokenPayload = jwt.verify(token, jwtSecret);        // Il va ici décoder le token a partir de notre secret. Parce que notre token a été encodé avec un secret donc il va essayé de décodé avec le mot de passe secret. La fonction .verify de la constante tokenPayload décode le token qui lui est donné pour analyse. (Dans la vidéo le log (donc le test) de "result" contenant la fonction ".verify{token, "PELICAN"}" a affiché : { userId : '67407579a42060ee1d2e62fc' , iat: 1685091846 , exp: 1685178246}). ATTENTION : verifiy analyse également le mot de passe secret inscrit ddans l'accolade. En l'occurence 'PELICAN'. Ici PELICAN est un mot de passe secret correct ce qui a permi a "verifiy" d'afficher le token mais si le a la place de PELICAN dans l'accolade on avait mis un autre MDP secret alors la verifiy aurait émis un bémol. En effet le server crash et affiche meme dans JsonWebTokenErro : invalid signature. DonC il faut également gérer le cas ou le MDP secret est invalide. Pour le cas ou le mot de passe est incorrect...
        if (tokenPayload == null) {                               // Si il n'arrive pas a le décodé / vérifié...
            res.status(401).send("Unauthorized");                   // ...Unauthorized (car alors il y'a de grandes chances que qqn ait cherché a modifier le body de ce token.) 
            return;
        }
        req.tokenPayload = tokenPayload;                          // Sinon on authorise du fait qu'on sait que le contenu de ce token est bon et donc nous qui avions mis le userId dans le token eh bien on va passer tout le payload sur la requete dans lequel on a fabriqué une clé du nom de "tokenpayload" et dans lequel on va mettre tout le tokenpayload. Pourquoi on fait ça ? On fait ça pour que la ligne de code ci-contre ayant été placé juste avant le next() et bénéficiant du décocage de token permis par ".verify" les fonctions d'après puissent acceder au token.. On met ca juste avant le next() afin que les fonctions d'aprés puissent y acceder. AME: Sinon si il est authorisé on est donc sur que le contenu du token est bon et donc nous qui avions mis le userId dans le token eh bien on va le récupérer. Donc le token décodé (tokenPayload) on va le prendre et le rajouté sur le body de la requete (sur une propriété qu'on appelle tokenpayload) afin que userId désormais décodé soit pris en compte (je crois) 
        console.log("tokenPayload:", tokenPayload);
        next();
    } catch (e) {                                               // Si il y'a un message d'erreur au niveau de la verif' du token alors... Pour gerer le cas d'erreur/crash du serveur qui se produit après la saisie d'un token incorrect, on met tout la partie de code concerné dans un try and catch
        console.error(e);
        res.status(401).send("Unauthorized");                     // ...au lieu que le serveur crash l'ordi va juste envoyé un erreur 401 et "Unauthorized"
    }
}

async function getBookById(req, res) {
    const id = req.params.id;                                          // On récupère l'id dans les params. Le id on l'a dans l'url. Exemple : On clique sur un bouquin dans le site. La page web va s'actualiser pour afficher une page contenant le livre sur lequel on a cliqué et indiquer dans la barre d'adresse : localhost:3000/livre/646798270acd094b8d586fb. Ici le params c'est tout simplement la dernière partie de l'adresse à savoir : "646798270acd094b8d586fb"
    try {
        const book = await Book.findById(id);                            // Ici le livre est cherché dans la base de donnée par son Id
        if (book == null) {                                              // Si on ne le trouve pas
            res.status(404).send("Book not found");                        // le livre n'a pas été trouvé
            return;
        }
        book.imageUrl = getAbsoluteImagePath(book.imageUrl);             //...Tu modifies le image Url du livre de sorte que l'adresse de l'image soit notre nouveau shéma d'écriture d'adresse "filename" que la fonction getabsoluteImagePath applique.
        res.send(book);
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong:" + e.message);
    }
}

async function postBook(req, res) {
    const stringifiedBook = req.body.book;
    const book = JSON.parse(stringifiedBook);                         // On veut maintenant enregistrer le "book" dans la base de donnée, Le probleme est que book affiche une suite de string (chaine de caractères). Si par exemple on cherche au sein du "book" seulement le titre, en tapant dans la console book.title, celle-ci affiche "title : undefined" parce que il s'agit de chaine de caractères, donc illisible pour la console. Donc on transforme le string en objet par JSON.parse. Desormais on peut maintenant acceder au book.title. Maintenant qu'on peu acceder au contenu de book qui a été objectifier eh bien on peut enref=gistrer l'ensemble dans la base de données
    const filename = req.file.filename;                               // filename va se charger (en entrant dans file --> puis filename) de récupérer le nom de l'image publiée. On tire ici bénéfice du fonctionnement des middlewares. Les informations ont été passée d'un middleware à un autre (en l'occurence de upload.single(image) à postBook) de tel sorte que postBook a maintenant accès au "file" normalement contenu dans "upload.single" et peut ainsi etre utilisé par lui. Donc quand on va faire un post sur le booksRouter, upload.single (autrement dit "multer") va avoir pour rôle de rajouter une propriété file sur notre requete histoire que postBook y ait accés.
    book.imageUrl = filename;                                         // Avant d'enregistrer notre book en base de donnée on va lui ajouter une imageURL qui est juste notre filename. Ici on va prendre le filename (le nom de l'image) qui se trouve dans "file" (file.filename) à savoir "16850358155558...jpg1685035815558.jpg" et déterminer que l'URL de l'image (image.Url) soit le nom de l'image en question. Problème concernant l'imageUrl. L'image ne s'affichait pas faute d'une bonne adresse Url reliant a l'image ("http://localhost:3000/uploads\16850358155558-0.jpg1685503"). De 1. on avait décidé de remplacer "uploads" par "images" de 2.Chercher sur localhost3000 revient à chercher sur le client : insensé car le client ne détient pas nos images. C'est le server qui détient ces images la. Il faudrait remplacer tout au plus par localhost4000; Mais meme ca on va éviter. de 3. Il vaut mieux de toute façon eviter les chemins absolus. Ce qu'on va faire plutot c'est mettre le nom du fichier dans la base de donnée (16850358155558...jpg1685035815558.jpg) 
    try {
        const result = await Book.create(book);                        // On dit ici le résultat de la requete (le fait d'appuyer sur "publier" tout simplement) va être que la base de données liée aux livres comprenant également son modèle de description/information (importé depuis Book.js) va intégrer book (le livre et sa description) que l'on vient de publier (par la méthode POST )
        res.send({ message: "Book posted", book: result });            // La réponse a la requete est "Le livre a été posté". A coté on a aussi ajouté le book tel que désormais affiché dans la base de donnée
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong:" + e.message);     // En cas d'erreur on renvoie une réponse d'erreur 500 suivie de "Something went wrong" + diffusion en front (par e.message) du message d'erreur affiché sur la console.
    }
}


async function getBooks(req, res) {                                // On veut ici récupérer des livres (lorsqu'on rentre dans le site on veut voir voir les livres deja present dans le site donc en base de donnée). On gère alors ici la requete(req) et la réponse(res)
    try {
        const books = await Book.find();                               // On dit ici d'aller chercher les livres disponibles dans la base de donnée. ATTENTION : Le "books" qui est ici est une variable locale. Il n'entre donc pas en conflit avec les autres "books" que l'on pourrait retriouver à l'extérieur du bloc de code ci-contre.
        books.forEach((book) => {                                      // Pour chaque livre (book) on va modifier son imageURL (l'url conduisant à l'image et permettant ainsi son affichage)
            book.imageUrl = getAbsoluteImagePath(book.imageUrl);                                     // ...Tu modifies le image Url du livre de sorte que l'adresse de l'image soit notre nouveau shéma d'écriture d'adresse "filename" que la fonction getabsoluteImagePath applique. L'image n'est pas en base de données. L'image elle est uniquement sur notre fichier systeme; Il faut donc que on donne une url vers nos images. On va donc dire a Express tu n'accedes pas à mes dossiers personelles, cependant, le dossier uploads et son contenu on va lui donner accès; Ainsi , quelqu'un qui fait une requete GET va effectivement avoir accès a tous les fichiers (ici image) contenu dans uploads. En cherchant sur Google comment procéder a un tel filtrage des dossiers auquel l'utilisateur aura accès on tombe sur "static-files in Express"
        });
        res.send(books);                                               // La réponse (res) est l'envoie (l'affichage ?) des livres présents dans la base de donnée. Concernant res.send(books) il va d'abord chercher dans la variable locale autrement dit dans "const books" (ligne 171) puis si il ne la trouve pas la il va prendre le books qui est tout en haut du code : "const { Book } = require("../models/Book")" (a réétudier car dans video le code de benj affiche books est devient Book plus tard)
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong:" + e.message);
    }
}


function getAbsoluteImagePath(fileName) {         // RAPPEL : Les arguments on les nomme comme on veut. Ils ne sortent pas de la ficntion et dsont invisibles a l'extérieur. On pourra les changer quand on appellera la fonction qui les contient. Ainsi "(FileName)" se convertira en "(book.imageUrl)" dans la ligne 173
    return process.env.PUBLIC_URL + "/" + process.env.IMAGES_PUBLIC_URL + "/" + fileName; // Il s'agit ici d'une autre manière d'écrire : "book.imageUrl = "http://localhost:4000/images/" + book.imageUrl;" -->  Ainsi on choisi de mettre "http://localhost:4000/" dans un process.env --> (PUBLIC_URL) et /images/ dans un process.env --> (IMAGES_FOLDER)
}


module.exports = { booksRouter }; 