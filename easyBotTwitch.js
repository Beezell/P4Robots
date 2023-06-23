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
    //INFO get TopGames Twitch
    _id: String,
    name: String,
    igdbId: String,
    //INFO get Games Igdb
    firstReleaseDate: Date,
    genres: [],
    summary: String,
    platforms: [],
    involvedCompanies: []
});
//Je crée mon Model
const GameModel = mongoose_1.default.model("Game", gameSchema);
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
                const gameTopGame = yield sendTwitchRequest(url, authorization, clientId);
                //Je récupère les données de mes jeux et je stock dans mon currentGame
                for (let i = 0; i < gameTopGame.data.length; i++) {
                    let currentGame = {
                        id: gameTopGame.data[i].id,
                        name: gameTopGame.data[i].name,
                        igdbId: gameTopGame.data[i].igdb_id,
                        summary: "",
                        genres: [],
                        platforms: [],
                        involvedCompanies: [],
                        firstReleaseDate: new Date(1972, 5, 18), //cette date par défaut car 1972 est l'année de la cation du permier jeuw-vidéo et je suis née le 18/05. Des bisous
                    };
                    //Requete pour Get Game API Igdb
                    let urlIgdb = `https://api.igdb.com/v4/games/${currentGame.igdbId}?fields=name,summary,genres.name,platforms.name,cover.image_id,first_release_date,involved_companies.company.name`;
                    const gameIgdb = yield sendTwitchRequest(urlIgdb, authorization, clientId);
                    //Je récupère les données des games et les stocks dans le currentGame
                    //Pour gérer lors qu'il n'y pas de firstReleaseDate
                    if (gameIgdb[0].first_release_date != undefined) {
                        currentGame.firstReleaseDate = convertUnixEpochToDate(gameIgdb[0].first_release_date);
                    }
                    //Toutes les données avec les tableaux : genres / platforms / incolvedCompanies
                    if (gameIgdb[0].genres != undefined) {
                        for (let i = 0; i < gameIgdb[0].genres.length; i++) {
                            currentGame.genres.push(gameIgdb[0].genres[i].name);
                        }
                    }
                    if (gameIgdb[0].platforms != undefined) {
                        for (let i = 0; i < gameIgdb[0].platforms.length; i++) {
                            currentGame.platforms.push(gameIgdb[0].platforms[i].name);
                        }
                    }
                    if (gameIgdb[0].involved_companies != undefined) {
                        for (let i = 0; i < gameIgdb[0].involved_companies.length; i++) {
                            currentGame.involvedCompanies.push(gameIgdb[0].involved_companies[i].name);
                        }
                    }
                    currentGame.summary = gameIgdb[0].summary;
                    yield updateGame(currentGame);
                }
                //MAJ de l'ur de la page suivante
                url = gameTopGame.pagination.cursor !== null ? `${url}?first=100&after=${gameTopGame.pagination.cursor}` : "";
            }
        }
        catch (error) {
            console.log("Ton Game Top il est pas ouf mais ça tu le sais : " + error);
        }
    });
}
//Méthode pour update ma database avec mon currentGame
function updateGame(gameData) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, name, igdbId, summary, firstReleaseDate, genres, platforms, incolvedCompanies } = gameData;
        try {
            //Recherche du game existant avec l'ID actuel
            const existingGame = yield GameModel.findById(id);
            if (existingGame) {
                existingGame.name = name;
                existingGame.igdbId = igdbId;
                existingGame.firstReleaseDate = firstReleaseDate;
                existingGame.genres = genres;
                existingGame.platforms = platforms;
                existingGame.involvedCompanies = incolvedCompanies;
                existingGame.summary = summary;
                yield existingGame.save();
            }
            else {
                //Le game n'existe pas donc création d'un nouveau
                const newGame = new GameModel({
                    _id: id,
                    name,
                    igdbId,
                    firstReleaseDate,
                    genres,
                    platforms,
                    incolvedCompanies,
                    summary,
                });
                yield newGame.save();
            }
        }
        catch (error) {
            console.error("Erreur lors de l'enregistrement du game :", error);
        }
    });
}
//Méthode pour convertire ma donné récupéré en unix Epoch en une date
function convertUnixEpochToDate(unixEpoch) {
    const milliseconds = unixEpoch * 1000;
    const date = new Date(milliseconds);
    return date;
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
