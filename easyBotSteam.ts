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
    _id: String
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
            //const gameRecover = games[i];
        
        
            //Je parcours la liste récupérer avec GetAllGames de Steam
            for(let i=0; i<SteamGamesAll.applist.apps.length; i++){
                
                //Je tcheck de savoir si le nom match
                if(games[i].name = SteamGamesAll.applist.apps[i].name){
                    const currentGameSteam = {
                        _id: games[i]._id,
                        name: SteamGamesAll.applist.apps[i].name
                      };
                
                      console.log(currentGameSteam);
                    
                    //await buildingGamesSteam(gameRecover, SteamGamesAll);
                }
            }
 
        }
    }catch(error){
        console.log("Le dernier nous fait sortir avec un name undifined donc DON'T PANIC ! " + error);
    }
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

async function buildingGamesSteam(gameRecover: any, SteamGamesAll: any){

    
    

    //Test ok !!! 
    /*
    let newGame = new GameSteamModel({
        _id: "test",
       
      });
      await newGame.save();
      */

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