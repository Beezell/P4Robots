/* 
------------PLAN D'ACTION POUR CE ROBOT DE MAITRE AMAURY------------
- Créer un objet dans lequel ranger mes données ✅
- Récupérer les donées de l'ISS et les ranger dans mon objet ✅
- Stocker mon objet en base de donnée Mongo ✅
- Edit de la DB et pas ajout systémqtique ✅
- Jeux complet avec IGDB! ❌
- le robot se lance tous les jours à 21h
--------------------------------------------------------------------
*/
import mongoose from "mongoose";

// J'ajoute cette ligne pour augmenter la limite d'écouteurs d'événements - SERT A RIEN POUR LE MOMENT
//mongoose.connection.setMaxListeners(0);

//Interface qui me sert pour mongoose
// interface IGameTop {
//   id: string;
//   name: string;
//   igdbId: string;
// }

//Je crée un schéma qui correspond à mon interface
const gameSchema = new mongoose.Schema({
  _id: String,
  name: String,
  igdbId: String,
});

//Je crée mon Model
const GameModel = mongoose.model("Game", gameSchema);

// Pour mon objet game qui est un topGame
class GameTopObject {
  constructor(
    public id?: string,
    public name?: string,
    public igdbId?: string
  ) {}
}

//ma petite liste de games pepouse
//var gameTopArray: GameTopObject[] = [];

async function fetchGame() {
  // Pour twitch besoin d'Authorization et de clientId
  let authorization = "Bearer 7tb61t29r3fhaft6ux6hh64fr1sf6v";
  let clientId = "7xereixlp03cyd9lsebf4om6rensrb";

  //La requête GET topGames
  let api = "https://api.twitch.tv/helix/games/top";
  let url = `${api}`;

  try {
    //Pour nous service pour les autorisations d'identification pour twitch
    const headers = new Headers();
    headers.append("Authorization", authorization);
    headers.append("Client-Id", clientId);

    //BOUCLE : pour parcourir les pages de résultats TANT QUE url!=null
    while (url) {
      //Utilise la requête et les autorisation pour celle ci
      const response = await fetch(url, { headers });

      let currentGame = new GameTopObject();
      if (response.ok) {
        const game = await response.json();

        if (game) {
          // Je récupère les données de mes jeux et je les stock dan ma gameArray
          for (let i = 0; i < game.data.length; i++) {
            currentGame.id = game.data[i].id;
            currentGame.name = game.data[i].name;
            currentGame.igdbId = game.data[i].igdb_id;
            //gameTopArray.push(currentGame);

            

            try {
                // Recherche du jeu existant avec l'ID actuel
                const existingGame = await GameModel.findById(currentGame.id);
  
                if (existingGame) {
                  // Le jeu existe déjà, donc MAJ de la DB
                  existingGame.name = currentGame.name;
                  existingGame.igdbId = currentGame.igdbId;
  
                  await existingGame.save();
                } else {
                  // Le jeu n'existe pas, création d'un nouveau game
                  const newGame = new GameModel({
                    _id: currentGame.id,
                    name: currentGame.name,
                    igdbId: currentGame.igdbId,
                  });
  
                  await newGame.save();
                }
              } catch (error) {
                console.error("Erreur lors de l'enregistrement du jeu :", error);
              }
            }
          }
        //MAJ de l'url de la page suivante
        url =
          game.pagination.cursor !== null
            ? `${api}?first=100&after=${game.pagination.cursor}`
            : ""; // Récupère l'URL de la page suivante s'il y en a une
      } else {
        throw new Error("Response not OK");
      }
    }
  } catch (error) {
    console.log("fetchGame foiré : " + error);
  }
}

async function displayAPItwitch() {
    //J'ouvre le flux vers mongoDB et je remplis la db
    mongoose.connect("mongodb://127.0.0.1:27017/pixelhunt_db");
    console.log("Connexion à MongoDB !");
    await fetchGame();
    mongoose.disconnect();
    console.log("On ferme MongoDB à clef svp");
  //console.log(gameTopArray);
  //console.log("La liste est grande sa mère : " + gameTopArray.length);
}

displayAPItwitch();
