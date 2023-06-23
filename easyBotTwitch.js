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
//Méthode qui cherche mes Games et qui les enregistre sur MongoDB
function fetchGame() {
    return __awaiter(this, void 0, void 0, function* () {
        //Token pour l'API Twhitch et IGDB
        const authorization = "Bearer 7tb61t29r3fhaft6ux6hh64fr1sf6v";
        const clientId = "7xereixlp03cyd9lsebf4om6rensrb";
        //Requête Get TopGames API Twitch
        const urlGetTopGames = "https://api.twitch.tv/helix/games/top";
        try {
            let url = urlGetTopGames;
            yield createGames(url, authorization, clientId);
        }
        catch (error) {
            console.log("ton fetch il est moyen : " + error);
        }
    });
}
//Pour les autorisation d'identification pour Twitch
function sendTwitchRequest(url, authorization, clientId) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = new Headers();
        headers.append("Authorization", authorization);
        headers.append("Client-Id", clientId);
        //Utilise la requête et les autorisation
        const response = yield fetch(url, { headers });
        if (!response.ok) {
            throw new Error("Response not OK ! Bolosse");
        }
        return response.json();
    });
}
//Première requête pour ma collection Games
function createGames(url, authorization, clientId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //BOUCLE : pour parcourir les pages de résultats TANT QUE url!=null
            while (url) {
                const game = yield sendTwitchRequest(url, authorization, clientId);
                //Je récupère les données de mes jeux et je stock dans mon currentGame
                for (let i = 0; i < game.data.length; i++) {
                    const currentGame = {
                        id: game.data[i].id,
                        name: game.data[i].name,
                        igdbId: game.data[i].igdb_id,
                    };
                    yield updateGame(currentGame);
                }
                //MAJ de l'ur de la page suivante
                url = game.pagination.cursor !== null ? `${url}?first=100&after=${game.pagination.cursor}` : "";
            }
        }
        catch (error) {
            console.log("Ton Game Top il est pas ouf mais ça tu le sais : " + error);
        }
    });
}
//Requête pour compléter la fiche du game avec les info de IGDB
function editGamesWitchGetGame(url, authorization, clientId) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
//Méthode pour update ma database avec mon currentGame
function updateGame(gameData) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, name, igdbId } = gameData;
        try {
            //Recherche du game existant avec l'ID actuel
            const existingGame = yield GameModel.findById(id);
            if (existingGame) {
                existingGame.name = name;
                existingGame.igdbId = igdbId;
                yield existingGame.save();
            }
            else {
                //Le game n'existe pas donc création d'un nouveau
                const newGame = new GameModel({
                    _id: id,
                    name,
                    igdbId,
                });
                yield newGame.save();
            }
        }
        catch (error) {
            console.error("Erreur lors de l'enregistrement du game :", error);
        }
    });
}
function display() {
    return __awaiter(this, void 0, void 0, function* () {
        //J'ouvre le flux vers mongoDB et je remplis la db
        mongoose_1.default.connect("mongodb://127.0.0.1:27017/pixelhunt_db");
        console.log("Connexion à MongoDB avec le sourire !");
        yield fetchGame();
        mongoose_1.default.disconnect();
        console.log("On ferme MongoDB à clef svp");
    });
}
display();
