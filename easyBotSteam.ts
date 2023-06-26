/* 
------------PLAN D'ACTION POUR CE ROBOT DE MAITRE AMAURY------------
- Créer un objet dans lequel ranger mes données ❌
- Récupérer le nom et id du game dans MongoDB ✅
- Récupérer les donées sur Steam et créé une nouvelle collection SteamGame avec le mm id que pour la collection Game ❌
- Stocker mon objet en base de donnée Mongo : SteamGame❌
- Edit de la DB et pas ajout systémqtique ❌
- le robot se lance chaque lundi matin à 8h ❌
--------------------------------------------------------------------
*/
import mongoose from "mongoose";

//Je crée un schéma pour récupérer mes games dans la collection game de MongoDB
const GameSchema = new mongoose.Schema({
    _id: String,
    name: String
})

//Je crée le model pour les games de la collection game de MongoDB
const GameModel = mongoose.model('Game', GameSchema)

//Je crée un schéma pour les gameSteam de la collection SteamGame de MongoDb
const GameSteamSchema = new mongoose.Schema({
    idGame: String,
    name: String,
    appid: String,
    type: String,
    requiredAge: Number,
    isFree: Boolean,
    supportedLanguage: String, 
    headerImage: String
})

//Je crée le model pour les gameSteam de la collection SteamGame de MongoDb
const GameSteamModel = mongoose.model('SteamGame', GameSteamSchema)

//Méthode qui cherche les games de mongo et qui va requête l'api Steam pour ma collection SteamGame
async function fetchGameSteam(){

    //Je récupère la liste de tous les jeux de Steam
    const SteamGamesAll = await getAllGameWithSteam();
    
    try{
        const games = await GameModel.find().exec();

        //Je parcours ma collection Game pour récupérer le Game
        for(let i=0; i<games.length; i++){
            const gameRecover = games[i];
        
            //Je parcours la liste récupérer avec GetAllGames de Steam
            for(let i=0; i<SteamGamesAll.applist.apps.length; i++){

                //Je tcheck de savoir si le nom match
                if(gameRecover.name == SteamGamesAll.applist.apps[i].name){

                  let currentGameSteam = {
                        idGame: gameRecover._id,
                        name: SteamGamesAll.applist.apps[i].name,
                        appid: SteamGamesAll.applist.apps[i].appid,
                        type: "",
                        requiredAge:0,
                        isFree:false,
                        supportedLanguage: "unknown",
                        headerImage: ""
                      };
                      
                  currentGameSteam = await updateCurrentGameSteamWithSteam(currentGameSteam);

                      console.log(currentGameSteam);
                  
                    
                    let newGameSteam = new GameSteamModel(currentGameSteam);
                       
                    //await newGameSteam.save();
                    
                    //await updateGameSteam(currentGameSteam)
                }
            }
 
        }
    }catch(error){
        console.log("Le dernier nous fait sortir avec un name undifined donc DON'T PANIC ! " + error);
    }

    
}

async function updateCurrentGameSteamWithSteam(currentGamesSteam:any){

  const oneGameSteam = await getOneGameSteam(currentGamesSteam)
  
  for(const appIdKey in oneGameSteam){
    if(oneGameSteam.hasOwnProperty(appIdKey)){
      const oneGame = oneGameSteam[appIdKey]
      console.log(oneGame.success);
        if(oneGame.success == true){
          currentGamesSteam.type = oneGame.data.type;
          currentGamesSteam.requiredAge = oneGame.data.required_age;
          currentGamesSteam.isFree = oneGame.data.is_free
          if(oneGame.data.supported_language!= undefined){
            currentGamesSteam.supportedLanguage = oneGame.data.supported_language
          }
          currentGamesSteam.headerImage = oneGame.data.header_image
          

        }

      break;
    }
  }
  

  
  //currentGamesSteam.type = oneGameSteam.type
  
  

  return currentGamesSteam;
}

async function getOneGameSteam(currentGamesSteam:any){
  const url = `https://store.steampowered.com/api/appdetails/?appids=${currentGamesSteam.appid}`;
    
  //Utilise la requête et les autorisation
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Response not OK ! Bolosse");
  }
  return response.json();

}

async function getAllGameWithSteam(){
    const url = "http://api.steampowered.com/ISteamApps/GetAppList/v2/";
    
    //Utilise la requête et les autorisation
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Response not OK ! Bolosse");
    }
    return response.json();
}

async function updateGameSteam(gameData: any) {
    const {
      id,
      name,
    } = gameData;
  
    try {
      //Recherche du game existant avec l'ID actuel
      const existingGame = await GameSteamModel.findById(id);
  
      if (existingGame) {
        //Je vérifie si la donnée à changer et la modif que si elle a changé
        //En vrai c'est nulle ! Va falloir trouver autre chose de mieux
        if (existingGame.name !== name) {
          existingGame.name = name;
        }
        
  
        await existingGame.save();
      } else {
        //Le game n'existe pas donc création d'un nouveau
        let newGame = new GameSteamModel({
          _id: id,
          name,
          
        });
  
        await newGame.save();
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du gameSteam :", error);
    }
  }

async function display() {
    const startTime = Date.now();
    //J'ouvre le flux vers mongoDB
    mongoose.connect("mongodb://127.0.0.1:27017/pixelhunt_db");
    console.log("Connexion à MongoDB avec le sourire !");
    await fetchGameSteam();     
    mongoose.disconnect();
    console.log("On ferme MongoDB à clef svp");
  
    const endTime = Date.now();
    calculateExecutionTime(startTime, endTime);
  }
  
  //Pour moi : pour savoir combien de temps ça met
  function calculateExecutionTime(startTime: any, endTime: any) {
    const executionTime = endTime - startTime;
    const minutes = Math.floor(executionTime / 60000);
    const seconds = Math.floor((executionTime % 60000) / 1000);
    const milliseconds = executionTime % 1000;
  
    console.log(`Temps d'exécution : ${minutes} minutes, ${seconds} secondes et ${milliseconds} millisecondes`);
  }


display();