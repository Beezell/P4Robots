"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const mongoose_1 = __importDefault(require("mongoose"));
// J'ajoute cette ligne pour augmenter la limite d'écouteurs d'événements - SERT A RIEN POUR LE MOMENT
//mongoose.connection.setMaxListeners(0);
//Interface qui me sert pour mongoose
// interface IGameTop {
//   id: string;
//   name: string;
//   igdbId: string;
// }
//Je crée un schéma qui correspond à mon interface
const gameSchema = new mongoose_1.default.Schema({
    _id: String,
    name: String,
    igdbId: String,
});
//Je crée mon Model
const GameModel = mongoose_1.default.model("Game", gameSchema);
// Pour mon objet game qui est un topGame
class GameTopObject {
    constructor(id, name, igdbId) {
        this.id = id;
        this.name = name;
        this.igdbId = igdbId;
    }
}
//ma petite liste de games pepouse
//var gameTopArray: GameTopObject[] = [];
function fetchGame() {
    return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield fetch(url, { headers });
                let currentGame = new GameTopObject();
                if (response.ok) {
                    const game = yield response.json();
                    if (game) {
                        // Je récupère les données de mes jeux et je les stock dan ma gameArray
                        for (let i = 0; i < game.data.length; i++) {
                            currentGame.id = game.data[i].id;
                            currentGame.name = game.data[i].name;
                            currentGame.igdbId = game.data[i].igdb_id;
                            //gameTopArray.push(currentGame);
                            try {
                                // Recherche du jeu existant avec l'ID actuel
                                const existingGame = yield GameModel.findById(currentGame.id);
                                if (existingGame) {
                                    // Le jeu existe déjà, donc MAJ de la DB
                                    existingGame.name = currentGame.name;
                                    existingGame.igdbId = currentGame.igdbId;
                                    yield existingGame.save();
                                }
                                else {
                                    // Le jeu n'existe pas, création d'un nouveau game
                                    const newGame = new GameModel({
                                        _id: currentGame.id,
                                        name: currentGame.name,
                                        igdbId: currentGame.igdbId,
                                    });
                                    yield newGame.save();
                                }
                            }
                            catch (error) {
                                console.error("Erreur lors de l'enregistrement du jeu :", error);
                            }
                        }
                    }
                    //MAJ de l'url de la page suivante
                    url =
                        game.pagination.cursor !== null
                            ? `${api}?first=100&after=${game.pagination.cursor}`
                            : ""; // Récupère l'URL de la page suivante s'il y en a une
                }
                else {
                    throw new Error("Response not OK");
                }
            }
        }
        catch (error) {
            console.log("fetchGame foiré : " + error);
        }
    });
}
function displayAPItwitch() {
    return __awaiter(this, void 0, void 0, function* () {
        //J'ouvre le flux vers mongoDB et je remplis la db
        mongoose_1.default.connect("mongodb://127.0.0.1:27017/pixelhunt_db");
        console.log("Connexion à MongoDB !");
        yield fetchGame();
        mongoose_1.default.disconnect();
        console.log("On ferme MongoDB à clef svp");
        //console.log(gameTopArray);
        //console.log("La liste est grande sa mère : " + gameTopArray.length);
    });
}
displayAPItwitch();
