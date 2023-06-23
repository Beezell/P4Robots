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

//Je crée un schéma qui correspond à mon interface
const gameSchema = new mongoose.Schema({
    //INFO get TopGames Twitch
    _id: String,
    name: String,
    igdbId: String,
    //INFO get Games Igdb
    summary: String,
    firstReleaseDate: Date,
    //genres: [String],
});

//Je crée mon Model
const GameModel = mongoose.model("Game", gameSchema);

// Pour mon objet game qui est un topGame
class GameTopObject {
  constructor(
    public id?: string,
    public name?: string,
    public igdbId?: string, 
  ) {}
}

//Méthode qui cherche mes Games et qui les enregistre sur MongoDB
async function fetchGame(){
    //Token pour l'API Twhitch et IGDB
    const authorization = "Bearer 7tb61t29r3fhaft6ux6hh64fr1sf6v";
    const clientId = "7xereixlp03cyd9lsebf4om6rensrb";

    //Requête Get TopGames API Twitch
    const urlGetTopGames = "https://api.twitch.tv/helix/games/top"


    try{
        let url = urlGetTopGames;
        await createGames(url, authorization, clientId);

    }catch (error){
        console.log("ton fetch il est moyen : " + error);
    }
}

//Pour les autorisation d'identification pour Twitch
async function sendTwitchRequest(url: any, authorization: any, clientId: any){
    const headers = new Headers();
    headers.append("Authorization", authorization);
    headers.append("Client-Id", clientId);

    //Utilise la requête et les autorisation
    const response = await fetch(url, {headers});
    if(!response.ok){
        throw new Error("Response not OK ! Bolosse");
    }
    return response.json()
}


//Première requête pour ma collection Games
async function createGames(url: any, authorization: any, clientId: any){
    try{
        //BOUCLE : pour parcourir les pages de résultats TANT QUE url!=null
        while (url){

            const gameTopGame = await sendTwitchRequest(url, authorization, clientId);

            //Je récupère les données de mes jeux et je stock dans mon currentGame
            for (let i = 0; i < gameTopGame.data.length; i++){
                let currentGame = {
                    id: gameTopGame.data[i].id,
                    name: gameTopGame.data[i].name,
                    igdbId: gameTopGame.data[i].igdb_id,
                    summary: "",
                    firstReleaseDate: new Date(1972,5,18),//cette date par défaut car 1972 est l'année de la cation du permier jeuw-vidéo et je suis née le 18/05. Des bisous
                }

                //Requete pour Get Game API Igdb
                let urlIgdb = `https://api.igdb.com/v4/games/${currentGame.igdbId}?fields=name,summary,genres.name,platforms.name,cover.image_id,first_release_date,involved_companies.company.name`
                const gameIgdb = await sendTwitchRequest(urlIgdb, authorization, clientId);

                //Je récupère les données des games et les stocks dans le currentGame


                //Pour gérer lors qu'il n'y pas de firstReleaseDate
                if(gameIgdb[0].first_release_date!=undefined){
                    currentGame.firstReleaseDate = convertUnixEpochToDate(gameIgdb[0].first_release_date);
                }
                
                currentGame.summary = gameIgdb[0].summary;
                
                await updateGame(currentGame);
            }
            //MAJ de l'ur de la page suivante
            url = gameTopGame.pagination.cursor !== null ? `${url}?first=100&after=${gameTopGame.pagination.cursor}` : "";
        }
    }catch (error){
        console.log("Ton Game Top il est pas ouf mais ça tu le sais : " + error);
    }
}

//Méthode pour update ma database avec mon currentGame
async function updateGame(gameData: any) {
    const { id, name, igdbId, summary, firstReleaseDate } = gameData;
  
    try {
        //Recherche du game existant avec l'ID actuel
      const existingGame = await GameModel.findById(id);
  
      if (existingGame) {
        existingGame.name = name;
        existingGame.igdbId = igdbId;
        existingGame.summary = summary;
        existingGame.firstReleaseDate = firstReleaseDate
        await existingGame.save();
      } else {
        //Le game n'existe pas donc création d'un nouveau
        const newGame = new GameModel({
          _id: id,
          name,
          igdbId,
          summary,
          firstReleaseDate
        });
        await newGame.save();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du game :", error);
    }
  }

  //Méthode pour convertire ma donné récupéré en unix Epoch en une date
function convertUnixEpochToDate(unixEpoch:any){
    const milliseconds = unixEpoch * 1000;
    const date = new Date(milliseconds);

    return date
}

async function display() {
    //J'ouvre le flux vers mongoDB et je remplis la db
    mongoose.connect("mongodb://127.0.0.1:27017/pixelhunt_db");
    console.log("Connexion à MongoDB avec le sourire !");
    await fetchGame();
    mongoose.disconnect();
    console.log("On ferme MongoDB à clef svp");
}

display();
