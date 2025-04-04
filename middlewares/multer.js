const multer = require("multer");                                                     // On installe multer dans le terminal pour gerer le formulaire (le formulaire qui s'affiche suite au souhait de l'utilisateur d'ajouter des livres) car javascrit et express ne peuvent gerer le foumulaire en form-data sans l'utilisation de multer

const storage = multer.diskStorage({                                                  // On veut rajouter quelques options au upload. On voudrait par exemple qu'au niveau du fichier que "upload" contient, ce dernier rajoute une extension jpeg s'agisssant ici d'une image.
  destination: function (req, file, cb) {
    cb(null, String(process.env.IMAGES_FOLDER));                                      // On dit à multer où stocker le fichier. On lui dit de le stocker dans le dossier "uploads" (cf .env) qui est situé dans le dossier racine de notre projet. On utilise process.env pour que l'on puisse changer la valeur de IMAGES_FOLDER dans le fichier ".env" sans avoir à modifier le code source.
  },
  filename: function (req, file, cb) {                                                // Gestion du nom du fichier
    const fileName = file.originalname.toLowerCase() + Date.now() + ".jpg";           // On gere ici le nom du fichier (ecrit en minuscule, avec la date et son extension) 
    cb(null, fileName);
  }
});

const upload = multer({                                                               // On crée une instance de multer et on lui passe la configuration que l'on vient de créer avec diskStorage. 
  storage                                                                             // la constante storage (situé dans le bloc de code ci-dessus) est activé.
});

module.exports = { upload };                                                          // On exporte multer. On va pouvoir l'utiliser dans bookscontroller.js et l'activer en appelant upload. cf dans bookscontroller.js à la ligne 35 : "booksRouter.post("/", checkToken, upload.single("image"), postBook); 