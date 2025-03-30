const multer = require("multer");          // On installe multer dans le terminal pour gerer le formulaire (le formulaire qui s'affiche suite au souhait de l'utilisateur d'ajouter des livres) car javascrit et express ne peuvent gerer le foumulaire en form-data sans l'utilisation de multer

const storage = multer.diskStorage({        // (cf modele sur internet) On veut rajouter quelques options au upload. On voudrait par exemple qu'au niveau du fichier que "upload" contient, ce dernier rajoute une extension jpeg s'agisssant ici d'une image. On fait alors une recherche sur google et on tombe sur le modele multer approprié concernant l'upload d'images par multer. 
  destination: function (req, file, cb) {
    cb(null, String(process.env.IMAGES_FOLDER)); // Est-ce ici l'endroit où on configure le chemin de l'upload ?
  },
  filename: function (req, file, cb) {           // Gestion du nom du fichier
    const fileName = file.originalname.toLowerCase() + Date.now() + ".jpg"; // On gere ici le nom du fichier (ecrit en minuscule, avec la date et son extension) 
    cb(null, fileName);
  }
});
const upload = multer({                   // (cf modèle multer) Pour utiliser activer le multer diskStorage on ecrit la constante upload et on y met entre accolade (storage). Donc multer va prendre le fichier qu'il a recu et il va le mettre dans une destination qui est "uploads/ Cela veut dire qu'en fait l'image ne va pas etre uploader en base de donnée ou quoi que ce soit, non elle va plutot etre uploadé directement sur le serveur, sur notre systeme de fichier il va nous fabriquer un dossier qui s'appelle donc "upload".
  storage                                 // la constante storage (situé dans le bloc de code ci-dessus) est activé.
});

module.exports = { upload };             // On exporte multer. On va pouvoir l'utiliser dans bookscontroller.js et l'activer en appelant upload. cf dans bookscontroller.js à la ligne 35 : "booksRouter.post("/", checkToken, upload.single("image"), postBook); 