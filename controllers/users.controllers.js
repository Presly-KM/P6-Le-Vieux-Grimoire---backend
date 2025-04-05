const { User } = require("../models/User");                                           // On importe le modèle User qui est un schéma de la base de donnée. On va donc pouvoir créer des utilisateurs dans la base de donnée grace a ce schéma.  
const bcrypt = require("bcrypt");                                                     // On importe bcrypt qui est un utilitaire qu'on utilise pour pour chiffrer des mots de passe.
const express = require("express");                                                   // Pour la gestion des routes et de l'API on importe express. 
const jwt = require("jsonwebtoken");                                                  // On importe jsonwebtoken qui est un utilitaire pour créer des tokens.

const usersRouter = express.Router();                                                 // Création d'un router pour la partie "users". La fonction express.Router() dans Express.js crée un nouvel objet routeur capable de gérer les requêtes de manière modulaire et organisée.   
usersRouter.post("/signup", signUp);                                                  // On configure la route pour s'inscrire au site web. On utilise la méthode POST afin que lors de l'inscription, les données tels que l'email et le password soient envoyés au serveur. Si l'utilisateur clique sur le bouton "sign up" alors une requete POST est envoyé sur l'endpoint /api/auth/signup. Ensuite il est fait appel à la fonction signUp (qui est définie plus bas dans le code) pour traiter cette requête.
usersRouter.post("/login", login);                                                    // On configure la route pour se connecter au site web. On utilise la méthode POST afin que lors de la connexion, les données tels que l'email et le password soient envoyés au serveur. Si l'utilisateur clique sur le bouton "login" alors une requete POST est envoyé sur l'endpoint /api/auth/login. Ensuite il est fait appel à la fonction login (qui est définie plus bas dans le code) pour traiter cette requête.


async function signUp(req, res) {                                                     // On crée une fonction asynchrone signUp qui va permettre de créer un utilisateur. On lui passe en argument la requete (req) et la réponse (res).
    const email = req.body.email;                                                     // On récupère ici l'email sur le body de la requete. Notre requete (req) a un body. C'est dans le body qu'on va trouver le contenu du Request Payload. (cf "Inspecter" pour consulter le Request Payload). En l'occurence le body ici est soit l'email soit le password 
    const password = req.body.password;                                               // On récupère le mot de passe sur le body de la requete.
    if (email == null || password == null) {                                          // Gestion des cas d'input invalides. On vérifie si l'email ou le mot de passe est null (c'est à dire vide). Si c'est le cas alors on envoie un message d'erreur.
        res.status(400).send("Email and password are required");                      // Si la case email ou password est vide on envoie le message d'erreur 400 : "Email and password are required". 
        return;
    }

    try {
        const userInDb = await User.findOne({                                         // On vérifie avant toute création d'utilisateur si ce dernier n'existe pas déjà dans la base de donnée avant d'en inscrire un nouveau.
            email: email                                                              // On cherche dans la base de donnée un utilisateur qui a le même email que celui entré par l'utilisateur.
        });
        if (userInDb != null) {                                                       // Si l'utilisateur (user) dans la base de donnée existe déjà, alors...
            res.status(400).send("Email already exists");                             // ... un message d'erreur informe que l'utilisateur existe déjà.
            return;                                                                 
        }
        const user = {                                                                // Dans le cas contraire, On crée un nouvel utilisateur (user) avec les informations récupérées dans le body de la requete...
            email,                                                                    // ...Des informations tel que l'email...
            password: hashPassword(password)                                          // ...et le mot de passe dont la fabrication va dépendre de la fonction hashpassword situé plus bas dans le code
        };
        await User.create(user);                                                      // On crée l'utilisateur dans la base de donnée grace à la méthode create de mongoose. On lui passe en argument l'utilisateur (user) qu'on vient de créer.
        res.send("Sign up");                                                          // On envoie une réponse au client pour lui dire que l'inscription a été un succès.
    } catch (e) {                                                                     // Gestion des erreurs. Si une erreur se produit lors de la création de l'utilisateur, on l'attrape ici.
        console.error(e);
        res.status(500).send("Something went wrong");                                 // Erreur 500 = concerne les erreurs cot" serveur et non utilisateur
    }
}




async function login(req, res) {                                                      // On crée une fonction asynchrone login qui va permettre de connecter un utilisateur. On lui passe en argument la requete (req) et la réponse (res).
    const body = req.body;                                                            // On recupère le body. Car le body contient l'email et le password.
    console.log("body:", body);                                         
    if (body.email == null || body.password == null) {                                // Gestion des cas d'input invalides
        res.status(400).send("Email and password are required");
        return;                                                                      
    }
    try {
    const userInDb = await User.findOne({                                             // On vérifie avant toute connexion d'un utilisateur si ce dernier existe bel et bien dans la base de donnée afin de pouvoir le connecter.
        email: body.email                                                             // On cherche donc dans la base de donnée un utilisateur qui a le même email que celui entré par l'utilisateur.
    });
    console.log("userInDb:", userInDb);
    if (userInDb == null) {                                                           // Si l'utilisateur cherche à se loguer alors qu'il n'existe pas encore dans la base de donnés... 
        res.status(401).send("Wrong credentials");                                    // ... Message d'erreur apparait : Pour des soucis de sécurité au lieu de mettre wwrong email ou password on met wrong credentials.
        return;
    }
    const passwordInDb = userInDb.password;                                           // On récupère le mot de passe qui se trouve dans la base de donnée pour que dans la ligne de code juste en bas on puisse le confronter au mot de passe venant d'être entré par l'utilisateur alors qu'il essaye de se connecter. 
    if (!isPasswordCorrect(req.body.password, passwordInDb)) {                        // Si le mot de passe n'est pas correct alors... (1er argument = mot de passe que vient d'entrer l'utilisateur, 2ème argument = mot de passe dans base de données qui d'ailleur haché)
        res.status(401).send("Wrong credentials");                                    // ... Message d'erreur apparait : wrong credentials. 
        return;
    }
    
    res.send({                                                                        // Si le mot de passe est correct 
        userId: userInDb._id,                                                         // On envoie l'id de l'utilisateur qui vient de se connecter (userInDb._id) et qui est présent dans la base de donnée.
        token: generateToken(userInDb._id)                                            // On génère un token pour l'utilisateur qui vient de se connecter. On lui passe en argument l'id de l'utilisateur qui vient de se connecter (userInDb._id). La fonction generateToken est définie plus bas dans le code.
    });
  } catch (e) {                                                                       // Gestion des erreurs. Si une erreur se produit lors de la connexion de l'utilisateur, on l'attrape ici.
    console.error(e);
    res.status(500).send("Something went wrokng");                                    // Dans le cas d'une erreur, une erreur 500 est envoyée au client pour lui dire qu'il y a eu un problème lors de la connexion.
  }
}

function generateToken(idInDb) {                                                      // C'est la fonction qui génère un token. Un token pour l'utilisateur enregistrée dans la base de donnée. Ainsi on mets en argument de la fonction (idInDb). 
    const payload = {                                                                 // Payload = la donnée principale, importante que l'on veut transmettre (l'id utilisateur, email, mot de passe etc..). Ici le payload est l'id utilisateur dans la database. 
      userId: idInDb                                                                  // l'user id sera l'id dans la base de donnée 
    };
    const jwtSecret = String(process.env.JWT_SECRET);                                 // En plus du payload le token va contenir le mot de passe secret que l'on va d'ailleurs cacher dans un env. On le stringyfy histoire de s'assurer que le mot de passe sera une string.
    const token = jwt.sign(payload, jwtSecret, {                                      // On utilise la méthode sign de jsonwebtoken pour créer le token. On lui passe en argument le payload (l'id utilisateur dans la database), le mot de passe secret et un objet d'options.
      expiresIn: "1d"                                                                 // Ici il s'agit de l'option du token. On a ajouté un délai d'expiration sur les tokens.
    });
    return token;                                                                     // Cette fonction retourne donc le token
  }
  


function hashPassword(password) {                                                     // Fonction qui va permettre de crypter le mot de passe. On lui passe en argument le mot de passe.
    console.log('password:', password)                          
    const salt = bcrypt.genSaltSync(10);                                              // bcrypt est un utilitaire qu'on utilise pour pour chiffrer des mots de passe. Ici on lui demande de passer 10 fois dessus. la constante salt genere un crypt différend (rajoute des caractères) pour les mots de passes identiques d'un utilisateur à un autre
    const hash = bcrypt.hashSync(password, salt);                                     // la constante hash concretise le cryptage du mot de passe 
    console.log("hash:", hash);
    return hash;                                                                      // On retourne le mot de passe crypté (hash) qui est en fait le mot de passe haché.
}


function isPasswordCorrect(password, hash) {                                          // Fonction qui va permettre de vérifier si le mot de passe est correct. En argument on retrouve le mot de passe fraichement entré + hash dans la base de donnée 
    console.log("hash:", hash)
    console.log('password:', password)                   
    const isOk = bcrypt.compareSync(password, hash);                                  // On utilise la méthode compareSync de bcrypt pour comparer le mot de passe et le hash. On lui passe en argument le mot de passe et le hash.
    console.log("isOk:", isOk);
    return isOk;                                                                      // On retourne bcrypt.compareSync qui va nous renvoyer un boolean ( true ou false) après avoir compar2 les éléments en arguments :  le mot de passe fraichement entré + hash dans la base de donnée  
}


module.exports = { usersRouter };                                                     // On exporte le router usersRouter pour pouvoir l'utiliser dans d'autres fichiers.