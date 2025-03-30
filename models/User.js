const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({              // Cf. le modele de mongoose sur leur site officiel (pris en photo dans mon phone). Contrairment au model qui place l'objet directement (et en une seul ligne) en deuxieme argument de la fonction mongoose.model ( const Cat = mongoose.model('Cat', { name: String }); ), nous on procede autrement car en général le deuxièeme agument name on le met dans qqch qui s'appelle un Schema.On choisi donc d'écrire une nouvelle const du nom de UserShema contenant l'objet. Il s'afiit ici de la represnetaiton en javascript d"une entité en base de donnéee
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);      // Cf. le modele de mongoose sur leur site officiel (pris en photo dans mon phone) On veut maintenant fabriquer un objet dans la base de données. Pour ce faire on utilise un modèle : un modele est une reprensaEntation en Javascript d'une instance / entité en base de données.


module.exports = { User };

