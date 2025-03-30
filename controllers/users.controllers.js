const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const express = require("express");  
const jwt = require("jsonwebtoken");

const usersRouter = express.Router();  
usersRouter.post("/signup", signUp);
usersRouter.post("/login", login);


async function signUp(req, res) {                                 // Apres Inspect de s'inscire (sign in) du site "Mon Vieux grimoire" On voit que le clique sur sign up envoie les données (l'email et password que nous avons rentré dans le site pour pouvoir nous inscrire) s'affichent dans Request Payload ce qui suppose qu'on a ici affaire a du POST et non du GET. Donc selon l'inspect et on est sensé fabriquer un endpoint /api/auth/signup sur une requete POST. La fonction sign up recoit comme parametre une requete et une réponse. On appelle les arguments comme on veut mais en générale la convention c'est de les appeler "req, res"
    const email = req.body.email;                                   // On récupère ici l'email sur le body de la requete. Notre requete (req) normalement elle a un body. C'est dans le body qu'on va trouver le contenu du Request Payload. (cf "Inspecter" pour cheker le Request Payload). En l'occurence le body ici est soit l'email soit le password 
    const password = req.body.password;                             // On récupère le mot de passe sur le body de la requete.
    if (email == null || password == null) {
        res.status(400).send("Email and password are required");      // send. est inhérent au res (response) car en tant que réponse il renvoie ou répond qqch a une requete (ici signup acompagné des données comme l'email et le password). Ici on dit, si la case email ou password est vide on envoie le message d'erreur suivant
        return;
    }

    try {
        const userInDb = await User.findOne({                         // Verification avant création d'un Utilisateur. Trouve moi dans la base de donnée un utilisateur dont... On veut ici checker si l'utilisateur existe déjà dans la base de donnée(db veut database) avant d'en inscrire un nouveau. ATTention mettre findONE et non pas find tout seul psk sinon User.find trouve ou renvoi un array. L'array va ensuite se comparer à un booleen (null)Ce qui va des le départ fausser le calcul. Un array est systématiquement différent de null d'ou le message "Email already exists". D'autre part userinDb la est une promesse du coup elle est forcement différente de null donc on ajoute un awaut devant User.findOne On dit : Pour le compte de User(constante), trouve/récupère moi...  
            email: email                                                // ... l'email (cf const email = req.body.email qui est donc l'email d'un user) qui nous a été passé dans le body et qui est stocké dans const email plus au dessus.(ligne 11)  // dont l'émail est = à body.email (plus haut dans le code)
        });
        if (userInDb != null) {                                       // Si l'User dans la base de donnée(constante) existe déjà, alors dire...
            res.status(400).send("Email already exists");               // Non désolé ça existe déja dans la base de données des Utilisateurs enregistrées (constante User)
            return;                                                     // Return necessaire pour stoper
        }
        const user = {                                               // Sinon on va fabriquer un user 
            email,
            password: hashPassword(password)                           // La fabrication du mot de passe va dépendre de la fonction hashpassword situé plus bas dans le code
        };
        await User.create(user);                                     // A REETUDIER mais il me semble qu'ici on dit met user(selon le shema ci dessus) dans la base de donné des user (User). Dans la constante User (tout en haut du code) on va se creer un user (a partir des infos présentes dans la constante user du dessus )
        res.send("Sign up");                                         // Indépendamment de tous ça, si on arrive a se connecter que la réponse du server soit alors "sign up"
    } catch (e) {
        console.error(e);
        res.status(500).send("Something went wrong");                // Erreur 500 = concerne les erreurs cot" serveur et non utilisateur
    }
}




async function login(req, res) {                                  // Pareil qu'on haut avec sign up . Donc selon l'inspect et on est sensé fabriquer un endpoint /api/auth/login sur une requete POST
    const body = req.body;
    console.log("body:", body);                                         // On recupère le body. Car le body contient l'email et le password.
    if (body.email == null || body.password == null) {              // Gestion des cas d'input invalides
        res.status(400).send("Email and password are required");
        return;                                                       // return est essentiel pour arreter le processus de rechercce et d'envoi d'erreur. Sans le return le processus de rechcherhe d'erreur analysera tout le code jusqu'a la fin de l'accolade.
    }
    try {
    const userInDb = await User.findOne({                       // Gestion de la base de données d'utilisateur
        email: body.email
    });
    console.log("userInDb:", userInDb);
    if (userInDb == null) {                                       // Si l'utilisateur cherche à se loguer alors qu'il n'existe pas encore dans la base de donnés... 
        res.status(401).send("Wrong credentials");                  // ... Message d'erreur apparait : Pour des soucis de sécurité au lieu de mettre wwrong email ou password on met wrong credentials.
        return;
    }
    const passwordInDb = userInDb.password;                       // On récupère le mot de passe qui se trouve dans la base de donnée pour dnas la ligne de code juste en abs pouvoir le confronter au mot de passe fraichement entré par l'utilisateur alors qu'il essaye de se connecter. 
    if (!isPasswordCorrect(req.body.password, passwordInDb)) {    // Si le mot de passe n'est pas correct alors (1er argument = mot de passe que vient d'entrer l'utilisateur, 2ème argument = motdepasse dans base de données qui d'ailleur haché)
        res.status(401).send("Wrong credentials");
        return;
    }
    
    res.send({                                                    // Conformément aux instructions du projet 7 le type de réponse attendu est l'id de l'utilisateur(userId) récupéré depuis la base de donnée : string / et un token: string  (cf pdf des instructions du projet 7 pour plus de precisions)
        userId: userInDb._id,                                       // On lui renvoi un user Id     (A REETUDIER)
        token: generateToken(userInDb._id)                          // Et on lui renvoi un token aprés qu'il ait récupéré l'id de l'utilisateur présent dans la base de donnée
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrokng");
  }
}

function generateToken(idInDb) {                      // C'est la fonction qui génère un token. Mais token pour qui ? Pour l'utilisateur enregistrée dans la base de donnée. Ainsi on mets en argument de la fonction (idInDb). REMARQUE : Apparemment l'envoi (ou création ?) de token se fait lorque l'on ajoute un livre !
    const payload = {                                   // Payload = la donnée principale, importante que l'on veut transmettre (l'id utilisateur, email, mot de passe etc..). Ici le payload est l'id utilisateur dans la database. 
      userId: idInDb                                    // l'user id sera l'id dans la base de donnée 
    };
    const jwtSecret = String(process.env.JWT_SECRET);   // En plus du payload frle token va contenir le mot de passe secret que l'on va d'ailleurs cacher dans un env. On le stringyfy histoire de s'assurer que le mot de passe sera une string (car on a eu affaire a des anomalises qui faisiat que mot de passe n'était pas en chaine de caractère)
    const token = jwt.sign(payload, jwtSecret, {        // On dit au token ici, signe le payload et le mot de passe secret
      expiresIn: "1d"                                   // Ici il s'agit de l'option du token. On a ajouté un délai d'expiration sur les tokens car tant qu'on a un token valide on ne va pas demander a l'utilisateur de se reloguer. A l'issue de ces 1h on demande l'utilsateur dee s'authentifier une nouvelle fois (genre tape ton mot de passe une nouvelle fois, de se loger une nouvelle fois)Ici l'expriration est 1jour. Au bout d'un jour on demande a l'utilisateur de se relogger. Le token sera donc valable endant 1 jour (1day)
    });
    return token;                                       // Cette fonction retourne donc le token
  }
  


function hashPassword(password) {
    console.log('password:', password)                          // Creation fonction hashpassword pour crypter le mot de passe (N.B si on regarde dans le siteweb Mongo atlas on voit bien que les mots de passes sont tous cryptés/hashés)
    const salt = bcrypt.genSaltSync(10);                         // bcrypt est un utilitaire qu'on utilise pour pour chiffrer des mots de passe. Ici on lui demande de passer 10 fois dessus. la constante salt genere un crypt différend (rajoute des caractères) pour les mots de passes identiques d'un utilisateur à un autre
    const hash = bcrypt.hashSync(password, salt);               // la constante hash concretise le cryptage du mot de passe 
    console.log("hash:", hash);
    return hash;                                                 //
}


function isPasswordCorrect(password, hash) {
    console.log("hash:", hash)
    console.log('password:', password)                   // fonction qui détermine si le mot de passe est correct... En argument on retrouve le mot de passe fraichement entrée + hash dans la base de donnée
    const isOk = bcrypt.compareSync(password, hash);
    console.log("isOk:", isOk);
    return isOk;                                        // (A REETUDIER)... On retourne bcrypt.compareSync qui va nous renvoyer un boolean (qui rentourne un true ou false) après avoir comparer les éléments en arguments :  le mot de passe fraichement entrée + hash dans la base de donnée              un mote de passe crypté
}


module.exports = { usersRouter };